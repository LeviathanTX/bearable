import { AICompanion, CoachTeam, LifestylePillar, User, CarePlan } from '../types';

// Mayo Clinic-backed Lifestyle Medicine Coaches
export class CoachTeamService {
  private static lifestylePillarCoaches: Record<LifestylePillar, AICompanion> = {
    optimal_nutrition: {
      id: 'nutrition-specialist',
      name: 'Dr. Maya Nutrition',
      personality: 'supportive',
      expertise: ['Mayo Clinic Nutrition', 'Plant-based diets', 'Metabolic health', 'Food as medicine'],
      avatar: '🥗',
      isActive: true,
      specialization: 'optimal_nutrition',
      role: 'pillar_specialist',
      credentials: ['Mayo Clinic Nutrition Specialist', 'Registered Dietitian'],
      mayoClinicProtocols: ['Diabetes Prevention Diet', 'Mediterranean Diet', 'DASH Diet']
    },
    physical_activity: {
      id: 'activity-specialist',
      name: 'Coach Alex Fitness',
      personality: 'coach',
      expertise: ['Exercise physiology', 'Strength training', 'Cardiovascular health', 'Injury prevention'],
      avatar: '🏃‍♂️',
      isActive: true,
      specialization: 'physical_activity',
      role: 'pillar_specialist',
      credentials: ['Exercise Physiologist', 'Mayo Clinic Fitness Specialist'],
      mayoClinicProtocols: ['Post-cardiac rehabilitation', 'Diabetes exercise program', 'Healthy aging fitness']
    },
    stress_management: {
      id: 'stress-specialist',
      name: 'Dr. Zen Mindfulness',
      personality: 'supportive',
      expertise: ['Mindfulness-based stress reduction', 'Cognitive behavioral therapy', 'Meditation', 'Resilience building'],
      avatar: '🧘‍♀️',
      isActive: true,
      specialization: 'stress_management',
      role: 'pillar_specialist',
      credentials: ['Licensed Psychologist', 'Mayo Clinic Stress & Resilience Program'],
      mayoClinicProtocols: ['MBSR Protocol', 'Stress reduction for chronic illness', 'Workplace wellness']
    },
    restorative_sleep: {
      id: 'sleep-specialist',
      name: 'Dr. Luna Sleep',
      personality: 'medical',
      expertise: ['Sleep medicine', 'Circadian rhythm disorders', 'Sleep hygiene', 'Insomnia treatment'],
      avatar: '😴',
      isActive: true,
      specialization: 'restorative_sleep',
      role: 'pillar_specialist',
      credentials: ['Sleep Medicine Specialist', 'Mayo Clinic Sleep Disorders Center'],
      mayoClinicProtocols: ['Sleep hygiene protocol', 'CBT for insomnia', 'Sleep apnea management']
    },
    connectedness: {
      id: 'connection-specialist',
      name: 'Dr. Harper Community',
      personality: 'friend',
      expertise: ['Social psychology', 'Community building', 'Relationship counseling', 'Social support systems'],
      avatar: '🤝',
      isActive: true,
      specialization: 'connectedness',
      role: 'pillar_specialist',
      credentials: ['Social Worker', 'Mayo Clinic Social Health Program'],
      mayoClinicProtocols: ['Social isolation intervention', 'Family caregiver support', 'Peer support programs']
    },
    substance_avoidance: {
      id: 'substance-specialist',
      name: 'Dr. Clear Recovery',
      personality: 'medical',
      expertise: ['Addiction medicine', 'Substance abuse counseling', 'Harm reduction', 'Recovery support'],
      avatar: '🚭',
      isActive: true,
      specialization: 'substance_avoidance',
      role: 'pillar_specialist',
      credentials: ['Addiction Medicine Specialist', 'Mayo Clinic Addiction Services'],
      mayoClinicProtocols: ['Smoking cessation program', 'Alcohol use disorder treatment', 'Opioid recovery support']
    }
  };

  public static createPersonalizedPrimaryCoach(user: User): AICompanion {
    return {
      id: `primary-coach-${user.id}`,
      name: 'Bearable',
      personality: this.mapCommunicationStyleToPersonality(user.preferences.communicationStyle),
      expertise: [
        'Lifestyle Medicine Coordination',
        'Behavioral Change',
        'Goal Setting',
        'Care Plan Management',
        'Mayo Clinic Protocols'
      ],
      avatar: '🐻',
      isActive: true,
      role: 'primary_coach',
      credentials: ['AI Health Coach', 'Mayo Clinic Lifestyle Medicine'],
      mayoClinicProtocols: ['Comprehensive lifestyle assessment', 'Care plan coordination', 'Progress monitoring']
    };
  }

  public static createCoachTeam(user: User): CoachTeam {
    return {
      primaryCoach: this.createPersonalizedPrimaryCoach(user),
      specialists: this.lifestylePillarCoaches,
      coordinationStrategy: 'collaborative'
    };
  }

  public static getSpecialistByPillar(pillar: LifestylePillar): AICompanion {
    return this.lifestylePillarCoaches[pillar];
  }

  public static getAllSpecialists(): AICompanion[] {
    return Object.values(this.lifestylePillarCoaches);
  }

  public static getCoachForHealthGoal(
    goal: { category: string },
    coachTeam: CoachTeam
  ): AICompanion {
    // Map goal categories to lifestyle pillars
    const categoryToPillar: Record<string, LifestylePillar> = {
      'nutrition': 'optimal_nutrition',
      'exercise': 'physical_activity',
      'sleep': 'restorative_sleep',
      'stress': 'stress_management',
      'social': 'connectedness',
      'substance': 'substance_avoidance'
    };

    const pillar = categoryToPillar[goal.category as string];
    if (pillar && coachTeam.specialists[pillar]) {
      return coachTeam.specialists[pillar];
    }

    // Default to primary coach for general goals
    return coachTeam.primaryCoach;
  }

  public static coordinateCoachResponse(
    userMessage: string,
    activeCoach: AICompanion,
    coachTeam: CoachTeam,
    carePlan?: CarePlan
  ): {
    respondingCoach: AICompanion;
    shouldEscalate: boolean;
    escalationReason?: string;
    consultSpecialists?: LifestylePillar[];
  } {
    // Analyze message for pillar-specific keywords
    const messageKeywords = userMessage.toLowerCase();

    // Keywords for each pillar
    const pillarKeywords = {
      optimal_nutrition: ['eat', 'food', 'diet', 'nutrition', 'meal', 'hungry', 'weight', 'sugar', 'diabetes'],
      physical_activity: ['exercise', 'workout', 'run', 'walk', 'gym', 'fitness', 'strength', 'cardio', 'activity'],
      stress_management: ['stress', 'anxiety', 'worry', 'pressure', 'overwhelmed', 'meditation', 'mindfulness'],
      restorative_sleep: ['sleep', 'tired', 'insomnia', 'rest', 'bed', 'dream', 'wake', 'fatigue'],
      connectedness: ['lonely', 'friends', 'family', 'social', 'relationship', 'support', 'community'],
      substance_avoidance: ['smoke', 'drink', 'alcohol', 'cigarette', 'addiction', 'substance', 'quit']
    };

    // Check if message requires specialist intervention
    for (const [pillar, keywords] of Object.entries(pillarKeywords)) {
      if (keywords.some(keyword => messageKeywords.includes(keyword))) {
        const typedPillar = pillar as LifestylePillar;
        const specialist = coachTeam.specialists[typedPillar];

        // If current coach is not the specialist and message is complex
        if (activeCoach.id !== specialist.id && this.isComplexQuery(userMessage)) {
          return {
            respondingCoach: specialist,
            shouldEscalate: false,
            consultSpecialists: [typedPillar]
          };
        }
      }
    }

    // Check for emergency/escalation keywords
    const emergencyKeywords = ['emergency', 'urgent', 'crisis', 'suicide', 'hurt', 'dangerous'];
    const shouldEscalate = emergencyKeywords.some(keyword => messageKeywords.includes(keyword));

    return {
      respondingCoach: activeCoach,
      shouldEscalate,
      escalationReason: shouldEscalate ? 'Emergency keywords detected' : undefined,
      consultSpecialists: []
    };
  }

  private static isComplexQuery(message: string): boolean {
    // Simple heuristic for complexity
    return message.length > 100 ||
           message.includes('?') ||
           message.split(' ').length > 20;
  }

  public static generateCoachIntroduction(coach: AICompanion, user: User): string {
    if (coach.role === 'primary_coach') {
      return `Hello ${user.name}! 🐻 I'm Bearable, your AI health coach, here to support you on your wellness journey. I work with a team of Mayo Clinic-backed specialists to help you achieve your health goals through lifestyle medicine. How can I help you today?`;
    }

    const specialtyIntros: Record<string, string> = {
      'nutrition-specialist': `Hi ${user.name}! I'm Dr. Maya, your nutrition specialist. I'm here to help you develop a sustainable, evidence-based approach to eating that supports your health goals. Let's explore how food can be your medicine! 🥗`,
      'activity-specialist': `Hey ${user.name}! Coach Alex here, ready to help you move your body in ways that feel good and support your health. Whether you're just starting out or looking to optimize your routine, I've got you covered! 🏃‍♂️`,
      'stress-specialist': `Hello ${user.name}, I'm Dr. Zen. I specialize in helping people develop healthy coping strategies and build resilience. Together, we'll explore mindfulness and stress management techniques that work for your lifestyle. 🧘‍♀️`,
      'sleep-specialist': `Good day ${user.name}! I'm Dr. Luna, your sleep medicine specialist. Quality sleep is foundational to health, and I'm here to help you achieve the restorative rest your body needs. 😴`,
      'connection-specialist': `Hi ${user.name}! I'm Dr. Harper, and I focus on the power of human connection and community for health. Let's explore how to strengthen your social bonds and find your support network. 🤝`,
      'substance-specialist': `Hello ${user.name}, I'm Dr. Clear. I'm here to support you in making healthy choices about substances and maintaining a lifestyle that serves your wellbeing. Every step forward matters. 🚭`
    };

    return specialtyIntros[coach.id] || `Hello ${user.name}! I'm ${coach.name}, here to help with ${coach.specialization?.replace('_', ' ')}.`;
  }

  private static mapCommunicationStyleToPersonality(
    communicationStyle: 'gentle' | 'encouraging' | 'direct' | 'supportive'
  ): 'supportive' | 'coach' | 'medical' | 'friend' | 'specialist' {
    switch (communicationStyle) {
      case 'gentle':
        return 'friend';
      case 'encouraging':
        return 'coach';
      case 'direct':
        return 'medical';
      case 'supportive':
        return 'supportive';
      default:
        return 'supportive';
    }
  }
}