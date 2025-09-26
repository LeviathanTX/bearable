import {
  Nudge,
  NudgeConfiguration,
  User,
  CarePlan,
  HealthGoal,
  ActivityLog,
  LifestylePillar,
  AICompanion,
  CoachTeam
} from '../types';

export class ProactiveNudgeService {
  private static nudgeTemplates: Record<string, {
    title: string;
    messageTemplate: string;
    pillar?: LifestylePillar;
    timing: {
      preferredTime: string;
      frequency: string;
    };
  }> = {
    // Nutrition nudges
    'meal_planning_reminder': {
      title: 'Weekly Meal Planning',
      messageTemplate: 'Hi {userName}! 🥗 Time to plan your meals for the week. Mayo Clinic research shows meal planning increases healthy eating by 40%.',
      pillar: 'optimal_nutrition',
      timing: { preferredTime: '10:00', frequency: 'weekly' }
    },
    'hydration_check': {
      title: 'Hydration Check-in',
      messageTemplate: 'Remember to stay hydrated, {userName}! 💧 Aim for 8 glasses of water today for optimal energy and health.',
      pillar: 'optimal_nutrition',
      timing: { preferredTime: '14:00', frequency: 'daily' }
    },

    // Physical Activity nudges
    'morning_movement': {
      title: 'Morning Movement',
      messageTemplate: 'Good morning, {userName}! 🌅 Ready to energize your day with some movement? Even 5 minutes makes a difference.',
      pillar: 'physical_activity',
      timing: { preferredTime: '07:00', frequency: 'daily' }
    },
    'post_meal_walk': {
      title: 'Post-Meal Walk',
      messageTemplate: 'Time for a post-meal walk, {userName}! 🚶‍♀️ A 5-minute walk can help regulate blood sugar and improve digestion.',
      pillar: 'physical_activity',
      timing: { preferredTime: '19:30', frequency: 'daily' }
    },

    // Stress Management nudges
    'midday_mindfulness': {
      title: 'Midday Mindfulness',
      messageTemplate: 'Taking a moment to breathe, {userName}? 🧘‍♀️ A 2-minute mindfulness break can reset your day.',
      pillar: 'stress_management',
      timing: { preferredTime: '12:00', frequency: 'daily' }
    },
    'stress_check_in': {
      title: 'Stress Level Check',
      messageTemplate: 'How are your stress levels today, {userName}? 💚 Remember, I\'m here to help you find healthy coping strategies.',
      pillar: 'stress_management',
      timing: { preferredTime: '16:00', frequency: 'daily' }
    },

    // Sleep nudges
    'wind_down_reminder': {
      title: 'Evening Wind-Down',
      messageTemplate: 'Time to start winding down, {userName} 🌙 Creating a calming bedtime routine helps prepare your body for restorative sleep.',
      pillar: 'restorative_sleep',
      timing: { preferredTime: '21:00', frequency: 'daily' }
    },
    'sleep_consistency': {
      title: 'Sleep Schedule Reminder',
      messageTemplate: 'Consistency is key for great sleep, {userName}! 😴 Try to go to bed and wake up at the same time every day.',
      pillar: 'restorative_sleep',
      timing: { preferredTime: '20:00', frequency: 'weekly' }
    },

    // Social Connection nudges
    'social_check_in': {
      title: 'Social Connection',
      messageTemplate: 'When did you last connect with someone you care about, {userName}? 🤝 Strong relationships are vital for health and happiness.',
      pillar: 'connectedness',
      timing: { preferredTime: '18:00', frequency: 'weekly' }
    },
    'gratitude_sharing': {
      title: 'Share Gratitude',
      messageTemplate: 'Consider sharing something you\'re grateful for with a friend today, {userName} 💕 Expressing gratitude strengthens relationships.',
      pillar: 'connectedness',
      timing: { preferredTime: '17:00', frequency: 'weekly' }
    },

    // Substance Avoidance nudges
    'healthy_alternatives': {
      title: 'Healthy Alternatives',
      messageTemplate: 'Feeling tempted by something unhealthy, {userName}? 🌿 Let\'s explore some healthier alternatives that can satisfy your needs.',
      pillar: 'substance_avoidance',
      timing: { preferredTime: '16:00', frequency: 'as_needed' }
    }
  };

  public static generateProactiveNudges(
    user: User,
    carePlan: CarePlan,
    coachTeam: CoachTeam,
    recentActivity: ActivityLog[],
    currentTime: Date = new Date()
  ): Nudge[] {
    const nudges: Nudge[] = [];

    // Analyze user activity patterns
    const activityPatterns = this.analyzeActivityPatterns(recentActivity, currentTime);

    // Generate time-based nudges
    nudges.push(...this.generateTimeBasedNudges(user, carePlan, coachTeam, currentTime));

    // Generate goal-progress based nudges
    nudges.push(...this.generateGoalProgressNudges(user, carePlan, coachTeam));

    // Generate pattern-based nudges
    nudges.push(...this.generatePatternBasedNudges(user, activityPatterns, coachTeam));

    // Generate milestone celebration nudges
    nudges.push(...this.generateCelebrationNudges(user, carePlan, coachTeam));

    // Filter and prioritize nudges
    return this.filterAndPrioritizeNudges(nudges, user);
  }

  private static analyzeActivityPatterns(
    recentActivity: ActivityLog[],
    currentTime: Date
  ): {
    missedDays: number;
    streakDays: number;
    preferredActivityTimes: string[];
    lowActivityPillars: LifestylePillar[];
    concerningPatterns: string[];
  } {
    const oneDayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentActivityByDay = this.groupActivityByDay(recentActivity, oneWeekAgo);
    const missedDays = this.calculateMissedDays(recentActivityByDay);
    const streakDays = this.calculateStreakDays(recentActivityByDay);
    const preferredActivityTimes = this.identifyPreferredTimes(recentActivity);
    const lowActivityPillars = this.identifyLowActivityPillars(recentActivity);
    const concerningPatterns = this.identifyConcerningPatterns(recentActivity);

    return {
      missedDays,
      streakDays,
      preferredActivityTimes,
      lowActivityPillars,
      concerningPatterns
    };
  }

  private static generateTimeBasedNudges(
    user: User,
    carePlan: CarePlan,
    coachTeam: CoachTeam,
    currentTime: Date
  ): Nudge[] {
    const nudges: Nudge[] = [];
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    // Check each nudge template for time-based triggers
    Object.entries(this.nudgeTemplates).forEach(([templateId, template]) => {
      if (this.shouldTriggerTimeBased(template, timeString, currentTime)) {
        const specialist = template.pillar ? coachTeam.specialists[template.pillar] : coachTeam.primaryCoach;

        nudges.push({
          id: `nudge-${templateId}-${Date.now()}`,
          type: 'reminder',
          title: template.title,
          message: this.personalizeMessage(template.messageTemplate, user),
          trigger: {
            type: 'time_based',
            conditions: { targetTime: template.timing.preferredTime },
            frequency: template.timing.frequency as any
          },
          timing: {
            preferredTime: template.timing.preferredTime,
            timezone: user.preferences.timezone,
            respectQuietHours: true,
            maxPerDay: 1
          },
          priority: 'medium',
          pillar: template.pillar,
          assignedCoach: specialist.id,
          isActive: true,
          createdAt: currentTime
        });
      }
    });

    return nudges;
  }

  private static generateGoalProgressNudges(
    user: User,
    carePlan: CarePlan,
    coachTeam: CoachTeam
  ): Nudge[] {
    const nudges: Nudge[] = [];
    const currentPhase = carePlan.phases[carePlan.currentPhase];

    if (!currentPhase) return nudges;

    currentPhase.goals.forEach(goal => {
      // Check for stalled progress
      if (goal.progress < 30 && this.daysSinceUpdate(goal.updatedAt) > 3) {
        const specialist = coachTeam.specialists[goal.category as LifestylePillar] || coachTeam.primaryCoach;

        nudges.push({
          id: `goal-nudge-${goal.id}-${Date.now()}`,
          type: 'encouragement',
          title: `Let's Get Back on Track with ${goal.title}`,
          message: this.generateGoalEncouragementMessage(goal, user),
          trigger: {
            type: 'goal_progress',
            conditions: { goalId: goal.id, thresholdProgress: 30 },
            frequency: 'as_needed'
          },
          timing: {
            timezone: user.preferences.timezone,
            respectQuietHours: true,
            maxPerDay: 2
          },
          priority: goal.progress < 10 ? 'high' : 'medium',
          pillar: goal.category as LifestylePillar,
          assignedCoach: specialist.id,
          isActive: true,
          createdAt: new Date()
        });
      }

      // Check for near completion
      if (goal.progress >= 80 && goal.progress < 100) {
        const specialist = coachTeam.specialists[goal.category as LifestylePillar] || coachTeam.primaryCoach;

        nudges.push({
          id: `goal-completion-${goal.id}-${Date.now()}`,
          type: 'encouragement',
          title: `You're Almost There! 🎯`,
          message: `${user.name}, you're so close to achieving "${goal.title}"! Just ${100 - goal.progress}% to go. I believe in you! 💪`,
          trigger: {
            type: 'goal_progress',
            conditions: { goalId: goal.id, thresholdProgress: 80 },
            frequency: 'as_needed'
          },
          timing: {
            timezone: user.preferences.timezone,
            respectQuietHours: true,
            maxPerDay: 1
          },
          priority: 'high',
          pillar: goal.category as LifestylePillar,
          assignedCoach: specialist.id,
          isActive: true,
          createdAt: new Date()
        });
      }
    });

    return nudges;
  }

  private static generatePatternBasedNudges(
    user: User,
    patterns: any,
    coachTeam: CoachTeam
  ): Nudge[] {
    const nudges: Nudge[] = [];

    // Missed days nudge
    if (patterns.missedDays >= 2) {
      nudges.push({
        id: `pattern-missed-days-${Date.now()}`,
        type: 'encouragement',
        title: 'I Miss You! 🐻',
        message: `Hi ${user.name}! I noticed we haven't connected in a few days. No judgment - life happens! Ready to jump back in together? Every small step counts. 💙`,
        trigger: {
          type: 'activity_based',
          conditions: { missedDays: patterns.missedDays },
          frequency: 'as_needed'
        },
        timing: {
          timezone: user.preferences.timezone,
          respectQuietHours: true,
          maxPerDay: 1
        },
        priority: patterns.missedDays >= 4 ? 'high' : 'medium',
        assignedCoach: coachTeam.primaryCoach.id,
        isActive: true,
        createdAt: new Date()
      });
    }

    // Streak celebration
    if (patterns.streakDays >= 7) {
      nudges.push({
        id: `pattern-streak-${Date.now()}`,
        type: 'gamification',
        title: '🔥 Amazing Streak!',
        message: `Wow, ${user.name}! ${patterns.streakDays} days of consistent progress! Your dedication to your health is inspiring. Keep up the fantastic work! 🌟`,
        trigger: {
          type: 'activity_based',
          conditions: { streakDays: patterns.streakDays },
          frequency: 'as_needed'
        },
        timing: {
          timezone: user.preferences.timezone,
          respectQuietHours: true,
          maxPerDay: 1
        },
        priority: 'low',
        assignedCoach: coachTeam.primaryCoach.id,
        isActive: true,
        createdAt: new Date()
      });
    }

    // Low activity pillar nudges
    patterns.lowActivityPillars.forEach((pillar: LifestylePillar) => {
      const specialist = coachTeam.specialists[pillar];
      nudges.push({
        id: `pattern-low-activity-${pillar}-${Date.now()}`,
        type: 'education',
        title: `Let's Focus on ${pillar.replace('_', ' ')}`,
        message: this.generatePillarMotivationMessage(pillar, user),
        trigger: {
          type: 'activity_based',
          conditions: { lowActivityPillar: pillar },
          frequency: 'weekly'
        },
        timing: {
          timezone: user.preferences.timezone,
          respectQuietHours: true,
          maxPerDay: 1
        },
        priority: 'medium',
        pillar,
        assignedCoach: specialist.id,
        isActive: true,
        createdAt: new Date()
      });
    });

    return nudges;
  }

  private static generateCelebrationNudges(
    user: User,
    carePlan: CarePlan,
    coachTeam: CoachTeam
  ): Nudge[] {
    const nudges: Nudge[] = [];
    const currentPhase = carePlan.phases[carePlan.currentPhase];

    if (!currentPhase) return nudges;

    // Check for achieved milestones
    currentPhase.milestones.forEach(milestone => {
      if (milestone.isAchieved && !milestone.celebrationMessage) {
        nudges.push({
          id: `celebration-${milestone.id}-${Date.now()}`,
          type: 'milestone_celebration',
          title: '🎉 Milestone Achieved!',
          message: `Congratulations, ${user.name}! You've achieved "${milestone.title}"! This is a significant step in your health journey. Take a moment to celebrate this accomplishment! 🎊`,
          trigger: {
            type: 'goal_progress',
            conditions: { milestoneId: milestone.id },
            frequency: 'once'
          },
          timing: {
            timezone: user.preferences.timezone,
            respectQuietHours: false, // Celebrations are immediate
            maxPerDay: 5
          },
          priority: 'high',
          assignedCoach: coachTeam.primaryCoach.id,
          isActive: true,
          createdAt: new Date()
        });
      }
    });

    return nudges;
  }

  private static filterAndPrioritizeNudges(nudges: Nudge[], user: User): Nudge[] {
    // Remove duplicates
    const uniqueNudges = nudges.filter((nudge, index, self) =>
      index === self.findIndex(n => n.title === nudge.title && n.type === nudge.type)
    );

    // Sort by priority and relevance
    const prioritized = uniqueNudges.sort((a, b) => {
      const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Limit to reasonable number per day
    const maxNudgesPerDay = 5;
    return prioritized.slice(0, maxNudgesPerDay);
  }

  // Helper methods
  private static shouldTriggerTimeBased(template: any, currentTime: string, date: Date): boolean {
    const targetTime = template.timing.preferredTime;
    const timeDiff = Math.abs(this.timeToMinutes(currentTime) - this.timeToMinutes(targetTime));

    // Trigger if within 15 minutes of target time
    return timeDiff <= 15;
  }

  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static personalizeMessage(template: string, user: User): string {
    return template.replace(/{userName}/g, user.name);
  }

  private static generateGoalEncouragementMessage(goal: HealthGoal, user: User): string {
    const messages = [
      `Hi ${user.name}! I noticed "${goal.title}" could use some attention. What's one small step we could take today? Remember, progress isn't always linear! 💙`,
      `${user.name}, every expert was once a beginner! Let's break "${goal.title}" into smaller, more manageable steps. What feels achievable right now?`,
      `Hey ${user.name}! "${goal.title}" is still important to you, right? Let's explore what might be getting in the way and find a path forward together. 🌟`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private static generatePillarMotivationMessage(pillar: LifestylePillar, user: User): string {
    const messages = {
      optimal_nutrition: `${user.name}, did you know that good nutrition is the foundation of energy and mood? Let's explore some delicious, healthy options that fit your lifestyle! 🥗`,
      physical_activity: `Movement is medicine, ${user.name}! Even 5 minutes of activity can boost your mood and energy. What type of movement sounds fun to you today? 🏃‍♀️`,
      stress_management: `${user.name}, managing stress isn't just about feeling better - it's about giving your body the best chance to heal and thrive. Let's find what works for you! 🧘‍♀️`,
      restorative_sleep: `Quality sleep is when your body does its best healing work, ${user.name}. Let's create the perfect environment for restorative rest! 😴`,
      connectedness: `Strong relationships are one of the best predictors of health and happiness, ${user.name}. Who in your life brings you joy? 🤝`,
      substance_avoidance: `Every healthy choice you make, ${user.name}, is an investment in your future self. Let's find alternatives that serve your wellbeing! 🌿`
    };
    return messages[pillar];
  }

  private static daysSinceUpdate(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  }

  private static groupActivityByDay(activity: ActivityLog[], since: Date): Map<string, ActivityLog[]> {
    const grouped = new Map<string, ActivityLog[]>();

    activity.filter(a => a.timestamp >= since).forEach(log => {
      const dayKey = log.timestamp.toDateString();
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(log);
    });

    return grouped;
  }

  private static calculateMissedDays(activityByDay: Map<string, ActivityLog[]>): number {
    const today = new Date();
    let missedDays = 0;

    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (!activityByDay.has(checkDate.toDateString())) {
        missedDays++;
      }
    }

    return missedDays;
  }

  private static calculateStreakDays(activityByDay: Map<string, ActivityLog[]>): number {
    const today = new Date();
    let streakDays = 0;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (activityByDay.has(checkDate.toDateString())) {
        streakDays++;
      } else {
        break;
      }
    }

    return streakDays;
  }

  private static identifyPreferredTimes(activity: ActivityLog[]): string[] {
    const timeSlots = new Map<string, number>();

    activity.forEach(log => {
      const hour = log.timestamp.getHours();
      const slot = `${hour.toString().padStart(2, '0')}:00`;
      timeSlots.set(slot, (timeSlots.get(slot) || 0) + 1);
    });

    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([time]) => time);
  }

  private static identifyLowActivityPillars(activity: ActivityLog[]): LifestylePillar[] {
    const pillarActivity = new Map<LifestylePillar, number>();
    const pillars: LifestylePillar[] = [
      'optimal_nutrition', 'physical_activity', 'stress_management',
      'restorative_sleep', 'connectedness', 'substance_avoidance'
    ];

    // Initialize all pillars
    pillars.forEach(pillar => pillarActivity.set(pillar, 0));

    // Count activity per pillar (simplified mapping)
    activity.forEach(log => {
      if (log.type === 'nutrition') pillarActivity.set('optimal_nutrition', pillarActivity.get('optimal_nutrition')! + 1);
      if (log.type === 'exercise') pillarActivity.set('physical_activity', pillarActivity.get('physical_activity')! + 1);
      if (log.type === 'mood' || log.category === 'stress') pillarActivity.set('stress_management', pillarActivity.get('stress_management')! + 1);
      if (log.type === 'sleep') pillarActivity.set('restorative_sleep', pillarActivity.get('restorative_sleep')! + 1);
    });

    // Return pillars with less than 2 activities in past week
    return pillars.filter(pillar => pillarActivity.get(pillar)! < 2);
  }

  private static identifyConcerningPatterns(activity: ActivityLog[]): string[] {
    const patterns: string[] = [];

    // Check for concerning keywords in activity descriptions
    const concerningKeywords = ['stressed', 'anxious', 'tired', 'overwhelmed', 'pain'];

    activity.forEach(log => {
      concerningKeywords.forEach(keyword => {
        if (log.description.toLowerCase().includes(keyword)) {
          patterns.push(`frequent_${keyword}`);
        }
      });
    });

    return Array.from(new Set(patterns)); // Remove duplicates
  }
}