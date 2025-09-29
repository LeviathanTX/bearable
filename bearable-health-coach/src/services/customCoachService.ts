import { CustomCoachTemplate, HealthSpecialist, VoiceOption, VoiceSettings } from '../types';
import { ElevenLabsVoiceService } from './elevenLabsVoiceService';

export class CustomCoachService {
  private static customCoaches: CustomCoachTemplate[] = [];
  private static voiceService = new ElevenLabsVoiceService();

  // Get all available voice options from all specialists for custom coaches
  static getAllAvailableVoices(): VoiceOption[] {
    const specialists = ElevenLabsVoiceService.HEALTH_SPECIALISTS;
    const allVoices: VoiceOption[] = [];

    Object.values(specialists).forEach(specialist => {
      specialist.voices.forEach(voice => {
        // Avoid duplicates by checking if voice ID already exists
        if (!allVoices.find(v => v.elevenlabs_voice_id === voice.elevenlabs_voice_id)) {
          allVoices.push(voice);
        }
      });
    });

    return allVoices;
  }

  // Create a new custom coach
  static createCustomCoach(
    userId: string,
    coachData: {
      name: string;
      title: string;
      specialization: string;
      description: string;
      avatar: string;
      personality: string;
      expertise: string[];
      systemPrompt: string;
      preferredVoiceId?: string;
      voiceSettings?: VoiceSettings;
      isPublic?: boolean;
    }
  ): CustomCoachTemplate {
    const template: CustomCoachTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...coachData,
      isPublic: coachData.isPublic || false,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0
    };

    this.customCoaches.push(template);
    return template;
  }

  // Convert a custom coach template to a HealthSpecialist for use in consultations
  static templateToSpecialist(template: CustomCoachTemplate): HealthSpecialist {
    const allVoices = this.getAllAvailableVoices();

    return {
      id: template.id,
      name: template.name,
      title: template.title,
      specialization: template.specialization,
      description: template.description,
      avatar: template.avatar,
      voices: allVoices, // Custom coaches can use any available voice
      defaultVoiceId: template.preferredVoiceId || allVoices[0]?.elevenlabs_voice_id || 'pNInz6obpgDQGcFmaJgB',
      personality: template.personality,
      expertise: template.expertise,
      isCustom: true,
      createdBy: template.createdBy,
      isActive: true,
      mayoClinicAffiliation: false
    };
  }

  // Get all custom coaches for a user
  static getUserCustomCoaches(userId: string): CustomCoachTemplate[] {
    return this.customCoaches.filter(coach =>
      coach.createdBy === userId || coach.isPublic
    );
  }

  // Get all public custom coaches
  static getPublicCustomCoaches(): CustomCoachTemplate[] {
    return this.customCoaches.filter(coach => coach.isPublic);
  }

  // Update a custom coach
  static updateCustomCoach(
    coachId: string,
    userId: string,
    updates: Partial<CustomCoachTemplate>
  ): CustomCoachTemplate | null {
    const coachIndex = this.customCoaches.findIndex(coach =>
      coach.id === coachId && coach.createdBy === userId
    );

    if (coachIndex === -1) return null;

    this.customCoaches[coachIndex] = {
      ...this.customCoaches[coachIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.customCoaches[coachIndex];
  }

  // Delete a custom coach
  static deleteCustomCoach(coachId: string, userId: string): boolean {
    const coachIndex = this.customCoaches.findIndex(coach =>
      coach.id === coachId && coach.createdBy === userId
    );

    if (coachIndex === -1) return false;

    this.customCoaches.splice(coachIndex, 1);
    return true;
  }

  // Get featured coach templates (popular/highly rated)
  static getFeaturedTemplates(): CustomCoachTemplate[] {
    return this.customCoaches
      .filter(coach => coach.isPublic)
      .sort((a, b) => (b.rating * b.usageCount) - (a.rating * a.usageCount))
      .slice(0, 10);
  }

  // Clone a public template for personal use
  static cloneTemplate(templateId: string, userId: string): CustomCoachTemplate | null {
    const template = this.customCoaches.find(coach =>
      coach.id === templateId && coach.isPublic
    );

    if (!template) return null;

    const cloned = this.createCustomCoach(userId, {
      name: `${template.name} (Copy)`,
      title: template.title,
      specialization: template.specialization,
      description: template.description,
      avatar: template.avatar,
      personality: template.personality,
      expertise: [...template.expertise],
      systemPrompt: template.systemPrompt,
      preferredVoiceId: template.preferredVoiceId,
      voiceSettings: template.voiceSettings ? { ...template.voiceSettings } : undefined,
      isPublic: false
    });

    // Increment usage count on original
    template.usageCount++;

    return cloned;
  }

  // Pre-populate with some example custom coaches
  static initializeWithExamples(userId: string = 'system') {
    // Only initialize if empty
    if (this.customCoaches.length > 0) return;

    // Diabetes Specialist
    this.createCustomCoach(userId, {
      name: 'Dr. Sarah Diabetes',
      title: 'Diabetes Management Specialist',
      specialization: 'Endocrinology',
      description: 'Specialized in comprehensive diabetes care, blood sugar management, and lifestyle modifications for diabetic patients',
      avatar: '🩺',
      personality: 'Caring, precise, and encouraging with focus on empowering patients to manage their condition',
      expertise: ['Blood Sugar Management', 'Diabetic Nutrition', 'Insulin Therapy', 'Lifestyle Medicine', 'Complications Prevention'],
      systemPrompt: 'You are Dr. Sarah, a diabetes specialist. Provide evidence-based advice on diabetes management, blood sugar control, and lifestyle modifications. Always emphasize the importance of working with healthcare providers for medical decisions.',
      preferredVoiceId: 'jsCqWAovK2LkecY7zXl4', // Freya - clear and knowledgeable
      isPublic: true
    });

    // Mental Health Coach
    this.createCustomCoach(userId, {
      name: 'Alex Mindfulness',
      title: 'Mental Health & Mindfulness Coach',
      specialization: 'Mental Health',
      description: 'Focuses on anxiety management, depression support, and mindfulness-based interventions for mental wellness',
      avatar: '🧠',
      personality: 'Empathetic, calm, and non-judgmental with expertise in evidence-based mental health practices',
      expertise: ['Anxiety Management', 'Depression Support', 'Mindfulness', 'Cognitive Behavioral Techniques', 'Emotional Regulation'],
      systemPrompt: 'You are Alex, a mental health coach specializing in mindfulness and anxiety management. Provide supportive, evidence-based strategies while always encouraging professional mental health care when needed.',
      preferredVoiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - empathetic
      isPublic: true
    });

    // Chronic Pain Specialist
    this.createCustomCoach(userId, {
      name: 'Dr. Chen Pain Management',
      title: 'Chronic Pain Specialist',
      specialization: 'Pain Medicine',
      description: 'Expert in chronic pain management, movement therapy, and quality of life improvement for pain patients',
      avatar: '⚡',
      personality: 'Understanding, patient, and focused on holistic pain management approaches',
      expertise: ['Chronic Pain', 'Movement Therapy', 'Pain Psychology', 'Alternative Therapies', 'Quality of Life'],
      systemPrompt: 'You are Dr. Chen, a chronic pain specialist. Help patients understand their pain, develop coping strategies, and improve quality of life through evidence-based approaches.',
      preferredVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm and empathetic
      isPublic: true
    });
  }
}