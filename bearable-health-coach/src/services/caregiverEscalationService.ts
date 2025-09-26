import {
  Caregiver,
  EscalationTrigger,
  CarePlan,
  User,
  CaregiverUpdate,
  ProactiveInsight,
  ActivityLog,
  LifestylePillar
} from '../types';

export class CaregiverEscalationService {

  // Predefined caregiver roles and their escalation levels
  private static caregiverHierarchy = {
    'emergency': ['physician', 'healthcare_provider'],
    'primary': ['family', 'physician', 'nurse'],
    'secondary': ['friend', 'coach', 'family']
  };

  private static mapSeverityToHierarchy(severity: 'low' | 'medium' | 'high' | 'critical'): 'emergency' | 'primary' | 'secondary' {
    switch (severity) {
      case 'critical':
        return 'emergency';
      case 'high':
        return 'primary';
      case 'medium':
      case 'low':
      default:
        return 'secondary';
    }
  }

  public static evaluateEscalationTriggers(
    carePlan: CarePlan,
    user: User,
    recentActivity: ActivityLog[],
    caregivers: Caregiver[]
  ): {
    triggeredEscalations: EscalationTrigger[];
    urgentAlerts: CaregiverUpdate[];
    recommendedActions: string[];
  } {
    const triggeredEscalations: EscalationTrigger[] = [];
    const urgentAlerts: CaregiverUpdate[] = [];
    const recommendedActions: string[] = [];

    // Evaluate each escalation trigger
    carePlan.escalationTriggers.forEach(trigger => {
      if (!trigger.isActive) return;

      const shouldEscalate = this.evaluateTriggerConditions(
        trigger,
        carePlan,
        user,
        recentActivity
      );

      if (shouldEscalate) {
        triggeredEscalations.push(trigger);

        // Create urgent alerts for appropriate caregivers
        const targetCaregivers = this.getTargetCaregivers(trigger, caregivers);
        targetCaregivers.forEach(caregiver => {
          const alert = this.createCaregiverAlert(trigger, user, caregiver);
          urgentAlerts.push(alert);
        });

        // Add recommended actions
        recommendedActions.push(...this.getRecommendedActions(trigger));
      }
    });

    return {
      triggeredEscalations,
      urgentAlerts,
      recommendedActions
    };
  }

  private static evaluateTriggerConditions(
    trigger: EscalationTrigger,
    carePlan: CarePlan,
    user: User,
    recentActivity: ActivityLog[]
  ): boolean {
    const now = new Date();
    const conditions = trigger.conditions;

    switch (trigger.type) {
      case 'no_engagement':
        return this.checkNoEngagement(conditions, recentActivity, now);

      case 'missed_goals':
        return this.checkMissedGoals(conditions, carePlan);

      case 'health_decline':
        return this.checkHealthDecline(conditions, recentActivity);

      case 'emergency_pattern':
        return this.checkEmergencyPattern(conditions, recentActivity, user);

      case 'user_request':
        return this.checkUserRequest(conditions, recentActivity);

      default:
        return false;
    }
  }

  private static checkNoEngagement(
    conditions: any,
    recentActivity: ActivityLog[],
    now: Date
  ): boolean {
    const timeWindowMs = this.parseTimeWindow(conditions.timeWindow || '72 hours');
    const cutoffTime = new Date(now.getTime() - timeWindowMs);

    // Check if user has any activity since cutoff time
    const recentEngagement = recentActivity.find(
      activity => activity.timestamp > cutoffTime
    );

    return !recentEngagement;
  }

  private static checkMissedGoals(conditions: any, carePlan: CarePlan): boolean {
    const currentPhase = carePlan.phases[carePlan.currentPhase];
    if (!currentPhase) return false;

    const threshold = conditions.threshold || 3;
    const missedGoals = currentPhase.goals.filter(
      goal => goal.status === 'active' && goal.progress < 20 // Less than 20% progress
    );

    return missedGoals.length >= threshold;
  }

  private static checkHealthDecline(
    conditions: any,
    recentActivity: ActivityLog[]
  ): boolean {
    const timeWindowMs = this.parseTimeWindow(conditions.timeWindow || '1 week');
    const cutoffTime = new Date(Date.now() - timeWindowMs);

    // Look for concerning patterns in health data
    const healthActivities = recentActivity.filter(
      activity =>
        activity.timestamp > cutoffTime &&
        ['vitals', 'mood', 'sleep', 'exercise'].includes(activity.type)
    );

    // Simple heuristic: check for declining trends
    // In a real implementation, this would be more sophisticated
    const negativeIndicators = healthActivities.filter(activity => {
      if (activity.type === 'mood' && activity.value && activity.value < 3) return true;
      if (activity.type === 'sleep' && activity.value && activity.value < 6) return true;
      if (activity.type === 'exercise' && activity.value && activity.value === 0) return true;
      return false;
    });

    return negativeIndicators.length >= (conditions.threshold || 2);
  }

  private static checkEmergencyPattern(
    conditions: any,
    recentActivity: ActivityLog[],
    user: User
  ): boolean {
    // Look for emergency keywords or patterns in recent activity
    const emergencyKeywords = [
      'emergency', 'crisis', 'suicide', 'self-harm', 'chest pain',
      'can\'t breathe', 'severe pain', 'urgent help'
    ];

    return recentActivity.some(activity =>
      emergencyKeywords.some(keyword =>
        activity.description.toLowerCase().includes(keyword)
      )
    );
  }

  private static checkUserRequest(
    conditions: any,
    recentActivity: ActivityLog[]
  ): boolean {
    // Check if user explicitly requested caregiver contact
    const requestKeywords = [
      'contact my doctor', 'need help', 'call family',
      'emergency contact', 'physician consultation'
    ];

    return recentActivity.some(activity =>
      requestKeywords.some(keyword =>
        activity.description.toLowerCase().includes(keyword)
      )
    );
  }

  private static parseTimeWindow(timeWindow: string): number {
    const units: { [key: string]: number } = {
      'hour': 60 * 60 * 1000,
      'hours': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'days': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'weeks': 7 * 24 * 60 * 60 * 1000
    };

    const match = timeWindow.match(/(\d+)\s*(\w+)/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return value * (units[unit] || units['hours']);
    }

    return 72 * 60 * 60 * 1000; // Default to 72 hours
  }

  private static getTargetCaregivers(
    trigger: EscalationTrigger,
    allCaregivers: Caregiver[]
  ): Caregiver[] {
    // If specific caregivers are assigned to trigger
    if (trigger.targetCaregivers.length > 0) {
      return allCaregivers.filter(c => trigger.targetCaregivers.includes(c.id));
    }

    // Otherwise, use severity-based hierarchy
    const severity = trigger.conditions.severity || 'medium';
    const hierarchyLevel = this.mapSeverityToHierarchy(severity);
    const appropriateRoles = this.caregiverHierarchy[hierarchyLevel] || this.caregiverHierarchy['secondary'];

    return allCaregivers.filter(caregiver =>
      appropriateRoles.includes(caregiver.relationship) &&
      caregiver.isActive &&
      this.canReceiveEscalation(caregiver, severity)
    );
  }

  private static canReceiveEscalation(caregiver: Caregiver, severity: string): boolean {
    // Check if caregiver's escalation level matches severity
    if (severity === 'critical' && caregiver.escalationLevel !== 'emergency') {
      return false;
    }

    // Check permissions
    if (!caregiver.permissions.receiveAlerts) {
      return false;
    }

    // Check quiet hours (if not emergency)
    if (severity !== 'critical') {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const quietStart = this.parseTime(caregiver.communicationPreferences.quietHours.start);
      const quietEnd = this.parseTime(caregiver.communicationPreferences.quietHours.end);

      if (quietStart && quietEnd) {
        if (quietStart < quietEnd) {
          // Same day quiet hours
          if (currentTime >= quietStart && currentTime <= quietEnd) {
            return false;
          }
        } else {
          // Overnight quiet hours
          if (currentTime >= quietStart || currentTime <= quietEnd) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private static parseTime(timeString: string): number | null {
    const match = timeString.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return parseInt(match[1]) * 100 + parseInt(match[2]);
    }
    return null;
  }

  private static createCaregiverAlert(
    trigger: EscalationTrigger,
    user: User,
    caregiver: Caregiver
  ): CaregiverUpdate {
    const severity = trigger.conditions.severity || 'medium';
    const urgencyLevel: Record<string, 'progress' | 'milestone' | 'concern' | 'celebration' | 'alert' | 'encouragement'> = {
      'low': 'alert',
      'medium': 'concern',
      'high': 'concern',
      'critical': 'alert'
    };

    return {
      id: `alert-${trigger.id}-${caregiver.id}-${Date.now()}`,
      userId: user.id,
      caregiverId: caregiver.id,
      type: urgencyLevel[severity] || 'alert',
      title: this.getAlertTitle(trigger, severity),
      message: this.formatEscalationMessage(trigger, user, caregiver),
      data: {
        triggerId: trigger.id,
        triggerType: trigger.type,
        severity,
        userId: user.id,
        timestamp: new Date()
      },
      isRead: false,
      createdAt: new Date()
    };
  }

  private static getAlertTitle(trigger: EscalationTrigger, severity: string): string {
    const titles = {
      'no_engagement': 'Patient Engagement Alert',
      'missed_goals': 'Care Plan Adherence Concern',
      'health_decline': 'Health Status Alert',
      'emergency_pattern': 'Emergency Pattern Detected',
      'user_request': 'Patient Requested Contact'
    };

    const prefix = severity === 'critical' ? '🚨 URGENT: ' : '⚠️ ';
    return prefix + (titles[trigger.type] || 'Care Alert');
  }

  private static formatEscalationMessage(
    trigger: EscalationTrigger,
    user: User,
    caregiver: Caregiver
  ): string {
    const baseMessage = trigger.escalationMessage;
    const now = new Date();

    let message = `Hello ${caregiver.name},\n\n`;
    message += `This is an automated alert regarding ${user.name}'s care plan.\n\n`;
    message += `Alert: ${baseMessage}\n\n`;
    message += `Time: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}\n`;
    message += `Severity: ${trigger.conditions.severity || 'Medium'}\n\n`;

    // Add role-specific guidance
    switch (caregiver.relationship) {
      case 'physician':
      case 'healthcare_provider':
        message += 'Clinical Review Recommended:\n';
        message += '• Review recent health data and care plan progress\n';
        message += '• Consider care plan modifications if needed\n';
        message += '• Schedule follow-up if appropriate\n';
        break;

      case 'family':
        message += 'Family Support Needed:\n';
        message += '• Check in with your loved one\n';
        message += '• Offer encouragement and emotional support\n';
        message += '• Help identify any barriers to care plan adherence\n';
        break;

      case 'friend':
        message += 'Peer Support Opportunity:\n';
        message += '• Reach out to offer friendship and support\n';
        message += '• Consider planning an activity together\n';
        message += '• Be a listening ear if needed\n';
        break;

      default:
        message += 'Support Action Recommended:\n';
        message += '• Reach out to check on the patient\n';
        message += '• Provide appropriate support based on your relationship\n';
    }

    message += '\n---\n';
    message += 'This alert was generated by BearAble AI Health Coach in coordination with Mayo Clinic protocols.\n';
    message += `Reply STOP to unsubscribe from alerts or contact support for assistance.`;

    return message;
  }

  private static getRecommendedActions(trigger: EscalationTrigger): string[] {
    const actionMap = {
      'no_engagement': [
        'Send motivational message through preferred communication channel',
        'Schedule check-in call or video session',
        'Simplify current care plan goals',
        'Identify and address potential barriers'
      ],
      'missed_goals': [
        'Review and adjust care plan difficulty',
        'Break large goals into smaller, achievable steps',
        'Increase coaching frequency temporarily',
        'Explore motivational incentives'
      ],
      'health_decline': [
        'Schedule urgent physician consultation',
        'Review medication adherence',
        'Assess for new symptoms or concerns',
        'Consider care plan intensity adjustment'
      ],
      'emergency_pattern': [
        'Immediately contact emergency services if warranted',
        'Activate crisis intervention protocol',
        'Notify primary physician urgently',
        'Ensure patient safety and support'
      ],
      'user_request': [
        'Contact user within 2 hours',
        'Assess specific needs and concerns',
        'Coordinate with requested caregiver type',
        'Document interaction and outcomes'
      ]
    };

    return actionMap[trigger.type] || [
      'Review patient status',
      'Contact appropriate caregivers',
      'Document incident and response'
    ];
  }

  public static generateCaregiverSummary(
    user: User,
    carePlan: CarePlan,
    recentActivity: ActivityLog[],
    insights: ProactiveInsight[]
  ): {
    overallStatus: 'excellent' | 'good' | 'concerning' | 'critical';
    progressSummary: string;
    keyInsights: string[];
    recommendedActions: string[];
    lastUpdate: Date;
  } {
    const currentPhase = carePlan.phases[carePlan.currentPhase];
    const goalProgress = currentPhase ?
      currentPhase.goals.reduce((sum, goal) => sum + goal.progress, 0) / currentPhase.goals.length : 0;

    const overallStatus = this.determineOverallStatus(goalProgress, insights, recentActivity);

    return {
      overallStatus,
      progressSummary: this.generateProgressSummary(carePlan, goalProgress),
      keyInsights: insights.slice(0, 3).map(insight => insight.description),
      recommendedActions: this.generateCaregiverRecommendations(overallStatus, insights),
      lastUpdate: new Date()
    };
  }

  private static determineOverallStatus(
    goalProgress: number,
    insights: ProactiveInsight[],
    recentActivity: ActivityLog[]
  ): 'excellent' | 'good' | 'concerning' | 'critical' {
    const criticalInsights = insights.filter(i => i.priority === 'high').length;
    const recentEngagement = recentActivity.length > 0;

    if (criticalInsights > 2 || !recentEngagement) return 'critical';
    if (goalProgress < 30 || criticalInsights > 0) return 'concerning';
    if (goalProgress < 70) return 'good';
    return 'excellent';
  }

  private static generateProgressSummary(carePlan: CarePlan, avgProgress: number): string {
    const currentPhase = carePlan.phases[carePlan.currentPhase];
    const phaseName = currentPhase?.name || 'Current Phase';

    return `${carePlan.title}: Currently in ${phaseName} with ${Math.round(avgProgress)}% average progress across lifestyle medicine pillars.`;
  }

  private static generateCaregiverRecommendations(
    status: string,
    insights: ProactiveInsight[]
  ): string[] {
    const baseRecommendations: Record<string, string[]> = {
      'excellent': [
        'Continue current support level',
        'Celebrate achievements and milestones',
        'Encourage maintenance of good habits'
      ],
      'good': [
        'Provide gentle encouragement',
        'Help identify areas for improvement',
        'Maintain regular check-ins'
      ],
      'concerning': [
        'Increase support and check-in frequency',
        'Help identify and address barriers',
        'Consider care plan adjustments'
      ],
      'critical': [
        'Immediate intervention may be needed',
        'Contact healthcare provider',
        'Provide intensive support'
      ]
    };

    const recommendations = baseRecommendations[status] || baseRecommendations['good'];

    // Add insight-specific recommendations
    const insightRecommendations = insights
      .filter(insight => insight.priority === 'high')
      .flatMap(insight => insight.actionRecommendations)
      .slice(0, 2);

    return [...recommendations, ...insightRecommendations];
  }
}