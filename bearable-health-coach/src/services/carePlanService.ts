import {
  CarePlan,
  CarePlanPhase,
  CarePlanMilestone,
  HealthGoal,
  User,
  CoachTeam,
  LifestylePillar,
  EscalationTrigger,
  ActivityRequirement,
  ProactiveInsight
} from '../types';

export class CarePlanService {

  public static createMayoClinicCarePlan(
    user: User,
    coachTeam: CoachTeam,
    targetConditions: string[] = [],
    selectedPillars: LifestylePillar[] = []
  ): CarePlan {
    const allPillars: LifestylePillar[] = [
      'optimal_nutrition',
      'physical_activity',
      'stress_management',
      'restorative_sleep',
      'connectedness',
      'substance_avoidance'
    ];

    const focusPillars = selectedPillars.length > 0 ? selectedPillars : allPillars;

    return {
      id: `care-plan-${user.id}-${Date.now()}`,
      userId: user.id,
      title: "Mayo Clinic Lifestyle Medicine Care Plan",
      description: "Comprehensive lifestyle intervention plan based on the 6 pillars of lifestyle medicine",
      lifestylePillars: focusPillars,
      phases: this.generateCarePlanPhases(focusPillars, user),
      currentPhase: 0,
      assignedTeam: coachTeam,
      escalationTriggers: this.createStandardEscalationTriggers(user.id),
      mayoClinicProtocols: [
        "Lifestyle Medicine Comprehensive Assessment",
        "Behavioral Change Protocol",
        "Chronic Disease Prevention Plan"
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  private static generateCarePlanPhases(
    pillars: LifestylePillar[],
    user: User
  ): CarePlanPhase[] {
    const phases: CarePlanPhase[] = [
      {
        id: 'phase-assessment',
        name: 'Assessment & Foundation',
        description: 'Comprehensive lifestyle assessment and goal setting',
        durationWeeks: 2,
        goals: this.createFoundationGoals(pillars, user),
        milestones: [
          {
            id: 'milestone-baseline',
            title: 'Baseline Assessment Complete',
            description: 'Complete initial health and lifestyle assessment across all pillars',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isAchieved: false
          },
          {
            id: 'milestone-goals-set',
            title: 'Personal Goals Established',
            description: 'Set specific, measurable goals for each lifestyle pillar',
            targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            isAchieved: false
          }
        ],
        requiredActivities: this.createAssessmentActivities(pillars)
      },
      {
        id: 'phase-initiation',
        name: 'Habit Initiation',
        description: 'Begin implementing small, sustainable changes in each pillar',
        durationWeeks: 4,
        goals: this.createInitiationGoals(pillars, user),
        milestones: [
          {
            id: 'milestone-daily-habits',
            title: 'Daily Habits Established',
            description: 'Successfully implement at least one daily habit per pillar',
            targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            isAchieved: false
          }
        ],
        requiredActivities: this.createInitiationActivities(pillars)
      },
      {
        id: 'phase-optimization',
        name: 'Optimization & Integration',
        description: 'Refine habits and integrate lifestyle changes more deeply',
        durationWeeks: 8,
        goals: this.createOptimizationGoals(pillars, user),
        milestones: [
          {
            id: 'milestone-integrated-lifestyle',
            title: 'Integrated Lifestyle Achieved',
            description: 'Successfully integrate all pillar practices into daily routine',
            targetDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
            isAchieved: false
          }
        ],
        requiredActivities: this.createOptimizationActivities(pillars)
      },
      {
        id: 'phase-maintenance',
        name: 'Maintenance & Mastery',
        description: 'Maintain progress and develop advanced practices',
        durationWeeks: 12,
        goals: this.createMaintenanceGoals(pillars, user),
        milestones: [
          {
            id: 'milestone-lifestyle-medicine-mastery',
            title: 'Lifestyle Medicine Mastery',
            description: 'Demonstrate sustained practice across all pillars with measurable health improvements',
            targetDate: new Date(Date.now() + 168 * 24 * 60 * 60 * 1000),
            isAchieved: false
          }
        ],
        requiredActivities: this.createMaintenanceActivities(pillars)
      }
    ];

    return phases;
  }

  private static createFoundationGoals(pillars: LifestylePillar[], user: User): HealthGoal[] {
    const goals: HealthGoal[] = [];

    pillars.forEach(pillar => {
      const goal = this.createPillarGoal(pillar, 'foundation', user);
      if (goal) goals.push(goal);
    });

    return goals;
  }

  private static createInitiationGoals(pillars: LifestylePillar[], user: User): HealthGoal[] {
    const goals: HealthGoal[] = [];

    pillars.forEach(pillar => {
      const goal = this.createPillarGoal(pillar, 'initiation', user);
      if (goal) goals.push(goal);
    });

    return goals;
  }

  private static createOptimizationGoals(pillars: LifestylePillar[], user: User): HealthGoal[] {
    const goals: HealthGoal[] = [];

    pillars.forEach(pillar => {
      const goal = this.createPillarGoal(pillar, 'optimization', user);
      if (goal) goals.push(goal);
    });

    return goals;
  }

  private static createMaintenanceGoals(pillars: LifestylePillar[], user: User): HealthGoal[] {
    const goals: HealthGoal[] = [];

    pillars.forEach(pillar => {
      const goal = this.createPillarGoal(pillar, 'maintenance', user);
      if (goal) goals.push(goal);
    });

    return goals;
  }

  private static createPillarGoal(
    pillar: LifestylePillar,
    phase: 'foundation' | 'initiation' | 'optimization' | 'maintenance',
    user: User
  ): HealthGoal | null {
    const goalTemplates = {
      optimal_nutrition: {
        foundation: {
          title: 'Complete Nutrition Assessment',
          description: 'Track current eating patterns and identify improvement opportunities',
          target: 'Log meals for 7 days and identify 3 improvement areas'
        },
        initiation: {
          title: 'Increase Vegetable Intake',
          description: 'Begin incorporating more whole foods and vegetables',
          target: 'Eat 5 servings of fruits and vegetables daily'
        },
        optimization: {
          title: 'Mediterranean Diet Implementation',
          description: 'Adopt Mediterranean-style eating pattern',
          target: 'Follow Mediterranean diet principles 80% of the time'
        },
        maintenance: {
          title: 'Sustained Healthy Eating',
          description: 'Maintain long-term healthy eating patterns',
          target: 'Maintain optimal nutrition habits with <20% deviation'
        }
      },
      physical_activity: {
        foundation: {
          title: 'Activity Level Assessment',
          description: 'Establish baseline fitness and activity preferences',
          target: 'Complete fitness assessment and activity preference survey'
        },
        initiation: {
          title: 'Daily Movement Goal',
          description: 'Establish consistent daily movement routine',
          target: 'Walk 7,000 steps daily or equivalent activity'
        },
        optimization: {
          title: 'Comprehensive Exercise Program',
          description: 'Implement structured exercise including cardio, strength, and flexibility',
          target: '150 minutes moderate cardio + 2 strength sessions + daily flexibility'
        },
        maintenance: {
          title: 'Active Lifestyle Mastery',
          description: 'Maintain active lifestyle with varied, enjoyable activities',
          target: 'Sustain exercise routine with 90% adherence'
        }
      },
      stress_management: {
        foundation: {
          title: 'Stress Pattern Recognition',
          description: 'Identify personal stress triggers and current coping mechanisms',
          target: 'Complete stress assessment and identify top 3 stressors'
        },
        initiation: {
          title: 'Daily Stress Relief Practice',
          description: 'Establish daily stress management practice',
          target: 'Practice 10 minutes of mindfulness or relaxation daily'
        },
        optimization: {
          title: 'Advanced Stress Resilience',
          description: 'Develop comprehensive stress management toolkit',
          target: 'Use 3+ stress management techniques regularly with measurable stress reduction'
        },
        maintenance: {
          title: 'Stress Resilience Mastery',
          description: 'Maintain effective stress management and emotional regulation',
          target: 'Maintain stress levels in healthy range with quick recovery from setbacks'
        }
      },
      restorative_sleep: {
        foundation: {
          title: 'Sleep Pattern Assessment',
          description: 'Track current sleep patterns and identify improvement areas',
          target: 'Track sleep for 2 weeks and identify 2 improvement opportunities'
        },
        initiation: {
          title: 'Consistent Sleep Schedule',
          description: 'Establish regular sleep-wake times',
          target: 'Sleep and wake within 30 minutes of target time 6/7 days'
        },
        optimization: {
          title: 'Sleep Quality Optimization',
          description: 'Optimize sleep environment and habits for quality rest',
          target: 'Achieve 7-9 hours quality sleep with <2 night wakings'
        },
        maintenance: {
          title: 'Sustained Sleep Excellence',
          description: 'Maintain optimal sleep patterns long-term',
          target: 'Maintain excellent sleep quality and duration 90% of nights'
        }
      },
      connectedness: {
        foundation: {
          title: 'Social Support Assessment',
          description: 'Evaluate current social connections and support systems',
          target: 'Map social network and identify connection opportunities'
        },
        initiation: {
          title: 'Regular Social Connection',
          description: 'Establish regular meaningful social interactions',
          target: 'Have meaningful social interaction 3+ times per week'
        },
        optimization: {
          title: 'Community Engagement',
          description: 'Develop deeper community connections and support relationships',
          target: 'Actively participate in 2+ community activities or support groups'
        },
        maintenance: {
          title: 'Rich Social Network',
          description: 'Maintain strong, supportive social connections',
          target: 'Sustain meaningful relationships with regular contact and mutual support'
        }
      },
      substance_avoidance: {
        foundation: {
          title: 'Substance Use Assessment',
          description: 'Honestly assess current substance use patterns',
          target: 'Complete substance use assessment and identify any concerning patterns'
        },
        initiation: {
          title: 'Healthy Alternatives',
          description: 'Replace harmful substances with healthy alternatives',
          target: 'Reduce harmful substance use by 50% and identify 3 healthy alternatives'
        },
        optimization: {
          title: 'Substance-Free Lifestyle',
          description: 'Achieve minimal or zero use of harmful substances',
          target: 'Maintain substance use within healthy guidelines or achieve abstinence'
        },
        maintenance: {
          title: 'Long-term Substance Wellness',
          description: 'Sustain healthy relationship with substances',
          target: 'Maintain healthy substance use patterns with strong coping strategies'
        }
      }
    };

    const template = goalTemplates[pillar]?.[phase];
    if (!template) return null;

    return {
      id: `goal-${pillar}-${phase}-${Date.now()}`,
      title: template.title,
      description: template.description,
      category: pillar,
      target: template.target,
      timeline: this.getPhaseTimeline(phase),
      progress: 0,
      status: 'active',
      assignedCoach: `${pillar}-specialist`,
      nudgeSettings: {
        enabled: true,
        frequency: 'medium',
        preferredTypes: ['reminder', 'encouragement', 'education'],
        personalizedStyle: this.mapCommunicationStyleToNudgeStyle(user.preferences.communicationStyle),
        respectQuietHours: true,
        adaptToMoodPattern: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private static getPhaseTimeline(phase: string): string {
    const timelines: Record<string, string> = {
      foundation: '2 weeks',
      initiation: '4 weeks',
      optimization: '8 weeks',
      maintenance: '12 weeks'
    };
    return timelines[phase] || '4 weeks';
  }

  private static mapCommunicationStyleToNudgeStyle(
    communicationStyle: 'gentle' | 'encouraging' | 'direct' | 'supportive'
  ): 'gentle' | 'motivational' | 'direct' | 'scientific' {
    switch (communicationStyle) {
      case 'gentle':
        return 'gentle';
      case 'encouraging':
        return 'motivational';
      case 'direct':
        return 'direct';
      case 'supportive':
        return 'scientific';
      default:
        return 'motivational';
    }
  }

  private static createAssessmentActivities(pillars: LifestylePillar[]): ActivityRequirement[] {
    return pillars.map(pillar => ({
      id: `assessment-${pillar}`,
      title: `${pillar.replace('_', ' ')} Assessment`,
      description: `Complete comprehensive assessment for ${pillar.replace('_', ' ')}`,
      pillar,
      frequency: 'weekly',
      target: { value: 1, unit: 'assessment' },
      isOptional: false
    }));
  }

  private static createInitiationActivities(pillars: LifestylePillar[]): ActivityRequirement[] {
    return pillars.map(pillar => ({
      id: `initiation-${pillar}`,
      title: `Begin ${pillar.replace('_', ' ')} Practice`,
      description: `Start implementing basic practices for ${pillar.replace('_', ' ')}`,
      pillar,
      frequency: 'daily',
      target: { value: 1, unit: 'practice' },
      isOptional: false
    }));
  }

  private static createOptimizationActivities(pillars: LifestylePillar[]): ActivityRequirement[] {
    return pillars.map(pillar => ({
      id: `optimization-${pillar}`,
      title: `Optimize ${pillar.replace('_', ' ')} Practices`,
      description: `Refine and deepen practices for ${pillar.replace('_', ' ')}`,
      pillar,
      frequency: 'daily',
      target: { value: 2, unit: 'advanced_practices' },
      isOptional: false
    }));
  }

  private static createMaintenanceActivities(pillars: LifestylePillar[]): ActivityRequirement[] {
    return pillars.map(pillar => ({
      id: `maintenance-${pillar}`,
      title: `Maintain ${pillar.replace('_', ' ')} Excellence`,
      description: `Sustain excellent practices for ${pillar.replace('_', ' ')}`,
      pillar,
      frequency: 'daily',
      target: { value: 1, unit: 'sustained_practice' },
      isOptional: false
    }));
  }

  private static createStandardEscalationTriggers(userId: string): EscalationTrigger[] {
    return [
      {
        id: `escalation-no-engagement-${userId}`,
        type: 'no_engagement',
        conditions: {
          timeWindow: '72 hours',
          severity: 'medium'
        },
        targetCaregivers: [], // Will be populated when caregivers are added
        escalationMessage: 'User has not engaged with care plan for 3 days. May need caregiver support.',
        isActive: true
      },
      {
        id: `escalation-missed-goals-${userId}`,
        type: 'missed_goals',
        conditions: {
          threshold: 3,
          timeWindow: '1 week',
          severity: 'high'
        },
        targetCaregivers: [],
        escalationMessage: 'User has missed multiple care plan goals. Consider plan adjustment or caregiver intervention.',
        isActive: true
      },
      {
        id: `escalation-health-decline-${userId}`,
        type: 'health_decline',
        conditions: {
          threshold: 2,
          timeWindow: '1 week',
          severity: 'critical'
        },
        targetCaregivers: [],
        escalationMessage: 'Health indicators suggest decline. Immediate caregiver review recommended.',
        isActive: true
      }
    ];
  }

  public static updateCarePlanProgress(
    carePlan: CarePlan,
    goalId: string,
    newProgress: number
  ): CarePlan {
    const updatedPlan = { ...carePlan };

    // Update goal progress in current phase
    const currentPhase = updatedPlan.phases[updatedPlan.currentPhase];
    if (currentPhase) {
      const goal = currentPhase.goals.find(g => g.id === goalId);
      if (goal) {
        goal.progress = newProgress;
        goal.updatedAt = new Date();

        // Check if goal is completed
        if (newProgress >= 100) {
          goal.status = 'completed';
        }
      }
    }

    // Check if phase milestones are achieved
    this.checkMilestoneAchievement(updatedPlan);

    // Check if ready to advance to next phase
    this.checkPhaseAdvancement(updatedPlan);

    updatedPlan.updatedAt = new Date();
    return updatedPlan;
  }

  private static checkMilestoneAchievement(carePlan: CarePlan): void {
    const currentPhase = carePlan.phases[carePlan.currentPhase];
    if (!currentPhase) return;

    currentPhase.milestones.forEach(milestone => {
      if (!milestone.isAchieved) {
        // Simple heuristic: milestone achieved if related goals are 80% complete
        const relatedGoals = currentPhase.goals;
        const avgProgress = relatedGoals.reduce((sum, goal) => sum + goal.progress, 0) / relatedGoals.length;

        if (avgProgress >= 80) {
          milestone.isAchieved = true;
          milestone.achievedDate = new Date();
          milestone.celebrationMessage = `🎉 Congratulations! You've achieved: ${milestone.title}`;
        }
      }
    });
  }

  private static checkPhaseAdvancement(carePlan: CarePlan): void {
    const currentPhase = carePlan.phases[carePlan.currentPhase];
    if (!currentPhase) return;

    // Check if all milestones in current phase are achieved
    const allMilestonesAchieved = currentPhase.milestones.every(m => m.isAchieved);

    // Check if most goals are completed (80% threshold)
    const completedGoals = currentPhase.goals.filter(g => g.status === 'completed').length;
    const goalCompletionRate = completedGoals / currentPhase.goals.length;

    if (allMilestonesAchieved && goalCompletionRate >= 0.8) {
      // Advance to next phase if available
      if (carePlan.currentPhase < carePlan.phases.length - 1) {
        carePlan.currentPhase++;
      }
    }
  }

  public static generateProactiveInsights(carePlan: CarePlan, userActivity: any[]): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    // Analyze goal progress patterns
    const currentPhase = carePlan.phases[carePlan.currentPhase];
    if (currentPhase) {
      currentPhase.goals.forEach(goal => {
        if (goal.progress < 30 && this.daysSinceCreated(goal.createdAt) > 7) {
          insights.push({
            id: `insight-low-progress-${goal.id}`,
            userId: carePlan.userId,
            type: 'goal_deviation',
            title: 'Goal Progress Opportunity',
            description: `Your ${goal.title} goal could use some attention. Let's explore what might help!`,
            data: { goalId: goal.id, currentProgress: goal.progress },
            confidence: 0.8,
            actionRecommendations: [
              'Break goal into smaller steps',
              'Schedule specific times for this activity',
              'Identify and address barriers'
            ],
            generatedBy: goal.assignedCoach,
            pillar: goal.category as LifestylePillar,
            priority: 'medium',
            createdAt: new Date(),
            isActedUpon: false
          });
        }
      });
    }

    return insights;
  }

  private static daysSinceCreated(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  }
}