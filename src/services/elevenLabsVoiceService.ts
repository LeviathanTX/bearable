import { VoiceSettings, HealthSpecialist, VoiceOption } from '../types';

export class ElevenLabsVoiceService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  // Mayo Clinic Health Team with ElevenLabs voices
  public static readonly HEALTH_SPECIALISTS: Record<string, HealthSpecialist> = {
    // Host/Facilitator
    'host-bearable': {
      id: 'host-bearable',
      name: 'BearAble Host',
      title: 'AI Health Consultation Facilitator',
      specialization: 'Healthcare Coordination',
      description: 'Your dedicated AI host who coordinates consultations and ensures all specialists work together effectively',
      avatar: '🐻',
      voices: [
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, warm
          name: 'Adam (Professional)',
          description: 'Professional and welcoming - perfect for facilitating health consultations',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Caring)',
          description: 'Caring and professional - excellent for creating a comfortable consultation environment',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Knowledgeable)',
          description: 'Clear and knowledgeable - great for coordinating complex health discussions',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized, diplomatic
          name: 'Domi (Organized)',
          description: 'Organized and diplomatic - perfect for managing multi-specialist consultations',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'pNInz6obpgDQGcFmaJgB',
      personality: 'Professional, coordinating, and patient with excellent facilitation skills',
      expertise: ['Health Coordination', 'Consultation Management', 'Care Planning', 'Team Communication']
    },
    'dr-maya-wellness': {
      id: 'dr-maya-wellness',
      name: 'Dr. Maya Chen',
      title: 'Wellness & Stress Management',
      specialization: 'Mind-Body Connection',
      description: 'Integrative wellness specialist focusing on stress reduction and mental health',
      avatar: '🧘‍♀️',
      voices: [
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, warm
          name: 'Adam (Professional)',
          description: 'Warm, professional tone - ideal for serious wellness discussions',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Gentle)',
          description: 'Gentle, soothing tone - perfect for stress management guidance',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Empathetic)',
          description: 'Empathetic, caring tone - excellent for emotional support',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm, empathetic
          name: 'Daniel (Mindful)',
          description: 'Deeply calm and mindful - perfect for meditation and mindfulness guidance',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.65, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic but calm for wellness
          name: 'Josh (Motivational)',
          description: 'Calm but motivational energy - great for inspiring wellness changes',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized, diplomatic
          name: 'Domi (Thoughtful)',
          description: 'Thoughtful and organized approach - excellent for systematic wellness planning',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'pNInz6obpgDQGcFmaJgB',
      personality: 'Calm, empathetic, and encouraging with a focus on mindfulness',
      expertise: ['Stress Management', 'Mindfulness', 'Work-Life Balance', 'Mental Health']
    },
    'coach-alex-fitness': {
      id: 'coach-alex-fitness',
      name: 'Coach Alex Rodriguez',
      title: 'Physical Activity & Movement',
      specialization: 'Exercise Physiology',
      description: 'Certified fitness coach specializing in sustainable movement and exercise habits',
      avatar: '💪',
      voices: [
        {
          elevenlabs_voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic, motivational
          name: 'Josh (Energetic)',
          description: 'High-energy, motivational tone - perfect for workout encouragement',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.4, similarity_boost: 0.8, style: 0.3, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, balanced
          name: 'Adam (Balanced)',
          description: 'Professional yet encouraging - ideal for structured fitness guidance',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.25, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized, diplomatic
          name: 'Domi (Supportive)',
          description: 'Supportive, encouraging tone - great for beginners and gentle motivation',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm, empathetic
          name: 'Daniel (Recovery)',
          description: 'Calm and recovery-focused - perfect for post-workout and rest day guidance',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.65, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Technical)',
          description: 'Clear and technical - excellent for explaining exercise mechanics and form',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Adaptive)',
          description: 'Adaptive and inclusive - great for all fitness levels and adaptive exercise',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.2, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
      personality: 'Energetic, motivational, and adaptable to all fitness levels',
      expertise: ['Exercise Planning', 'Movement', 'Strength Training', 'Cardio Health']
    },
    'nutritionist-sarah': {
      id: 'nutritionist-sarah',
      name: 'Sarah Thompson, RD',
      title: 'Nutrition & Healthy Eating',
      specialization: 'Clinical Nutrition',
      description: 'Registered dietitian focused on sustainable nutrition and healthy eating habits',
      avatar: '🥗',
      voices: [
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Expert)',
          description: 'Clear, knowledgeable tone - perfect for nutritional education',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Caring)',
          description: 'Warm, caring tone - excellent for food relationship discussions',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, warm
          name: 'Adam (Practical)',
          description: 'Practical, straightforward approach - ideal for meal planning',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic
          name: 'Josh (Encouraging)',
          description: 'Encouraging and motivational - perfect for dietary habit changes',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm
          name: 'Daniel (Gentle)',
          description: 'Gentle and patient - excellent for food relationship and emotional eating support',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.65, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized
          name: 'Domi (Scientific)',
          description: 'Organized and scientific - great for nutritional education and research-backed advice',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.1, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'jsCqWAovK2LkecY7zXl4',
      personality: 'Knowledge-driven, practical, and supportive of gradual changes',
      expertise: ['Meal Planning', 'Nutritional Science', 'Dietary Guidelines', 'Food Relationships']
    },
    'therapist-david': {
      id: 'therapist-david',
      name: 'Dr. David Kim',
      title: 'Sleep & Recovery',
      specialization: 'Sleep Medicine',
      description: 'Sleep specialist helping optimize rest and recovery for better health',
      avatar: '😴',
      voices: [
        {
          elevenlabs_voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm, empathetic
          name: 'Daniel (Calming)',
          description: 'Deeply calm, soothing voice - perfect for sleep guidance and relaxation',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.6, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, warm
          name: 'Adam (Clinical)',
          description: 'Professional, analytical tone - ideal for clinical sleep advice',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Gentle)',
          description: 'Gentle, nurturing approach - great for sleep anxiety and concerns',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.65, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Sleep Science)',
          description: 'Clear and scientific - excellent for sleep education and circadian rhythm guidance',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized
          name: 'Domi (Sleep Protocol)',
          description: 'Organized and methodical - perfect for sleep hygiene protocols and tracking',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic but calm
          name: 'Josh (Recovery)',
          description: 'Calm energy - great for discussing active recovery and sleep-exercise balance',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.75, style: 0.15, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'onwK4e9ZLuTAKqWW03F9',
      personality: 'Calm, analytical, and focused on evidence-based sleep improvement',
      expertise: ['Sleep Hygiene', 'Recovery', 'Rest Optimization', 'Circadian Rhythms']
    },
    'dr-lisa-relationships': {
      id: 'dr-lisa-relationships',
      name: 'Dr. Lisa Martinez',
      title: 'Social Connections & Relationships',
      specialization: 'Social Psychology',
      description: 'Specialist in building meaningful relationships and social wellness',
      avatar: '👥',
      voices: [
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Warm)',
          description: 'Warm, empathetic tone - perfect for relationship discussions',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Insightful)',
          description: 'Clear, insightful approach - excellent for communication skills training',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, warm
          name: 'Adam (Balanced)',
          description: 'Balanced, professional perspective - great for workplace relationships',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm
          name: 'Daniel (Compassionate)',
          description: 'Deeply compassionate - excellent for relationship healing and emotional support',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.65, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic
          name: 'Josh (Social)',
          description: 'Socially energetic - perfect for building confidence in social situations',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized
          name: 'Domi (Strategic)',
          description: 'Strategic and thoughtful - great for relationship planning and communication strategies',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'XB0fDUnXU5powFXDhCwa',
      personality: 'Warm, insightful, and focused on building authentic connections',
      expertise: ['Relationship Building', 'Communication Skills', 'Social Wellness', 'Community']
    },
    'dr-chen-purpose': {
      id: 'dr-chen-purpose',
      name: 'Dr. Michael Chen',
      title: 'Purpose & Life Meaning',
      specialization: 'Positive Psychology',
      description: 'Helps individuals discover purpose and create meaningful life direction',
      avatar: '🎯',
      voices: [
        {
          elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - organized, diplomatic
          name: 'Domi (Inspiring)',
          description: 'Thoughtful, inspiring tone - perfect for life purpose discussions',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - professional, warm
          name: 'Adam (Wise)',
          description: 'Wise, grounded approach - ideal for values and goal-setting work',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - soothing, professional
          name: 'Charlotte (Supportive)',
          description: 'Supportive, encouraging tone - excellent for personal growth exploration',
          gender: 'female',
          accent: 'American',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.2, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - clear, knowledgeable
          name: 'Freya (Philosophical)',
          description: 'Clear and philosophical - excellent for deep purpose and meaning discussions',
          gender: 'female',
          accent: 'British',
          settings: { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm
          name: 'Daniel (Reflective)',
          description: 'Calm and reflective - perfect for introspective work and values exploration',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.7, similarity_boost: 0.65, style: 0.1, use_speaker_boost: false }
        },
        {
          elevenlabs_voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic
          name: 'Josh (Action-Oriented)',
          description: 'Energetic and action-oriented - great for turning purpose into concrete goals',
          gender: 'male',
          accent: 'American',
          settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: false }
        }
      ],
      defaultVoiceId: 'AZnzlk1XvdvUeBnXmlld',
      personality: 'Thoughtful, inspiring, and focused on personal growth and meaning',
      expertise: ['Life Purpose', 'Goal Setting', 'Personal Growth', 'Values Clarification']
    }
  };

  constructor() {
    // API key will be provided via environment variable
    this.apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ ElevenLabs API key not found. Voice features will use fallback.');
    } else {
      console.log('🎤 ElevenLabs Voice Service initialized successfully');
    }
  }

  async generateSpeech(
    text: string,
    specialistId?: string,
    customVoiceId?: string,
    customSettings?: VoiceSettings
  ): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Get specialist or use default
    const specialist = specialistId
      ? ElevenLabsVoiceService.HEALTH_SPECIALISTS[specialistId]
      : ElevenLabsVoiceService.HEALTH_SPECIALISTS['dr-maya-wellness'];

    if (!specialist) {
      throw new Error(`Specialist not found: ${specialistId}`);
    }

    // Get the specific voice (custom voice ID or default voice)
    const targetVoiceId = customVoiceId || specialist.defaultVoiceId;
    const selectedVoice = specialist.voices.find(v => v.elevenlabs_voice_id === targetVoiceId);

    if (!selectedVoice) {
      throw new Error(`Voice not found: ${targetVoiceId} for specialist ${specialistId}`);
    }

    const voiceId = selectedVoice.elevenlabs_voice_id;
    const settings = {
      ...selectedVoice.settings,
      ...customSettings
    };

    // Clean and limit text
    const cleanedText = this.cleanTextForSpeech(text).substring(0, 5000);

    const url = `${this.baseUrl}/text-to-speech/${voiceId}/stream`;

    try {
      console.log(`🎤 Generating speech for ${specialist.name}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: 'eleven_multilingual_v2', // Updated to latest model
          voice_settings: settings,
          output_format: 'mp3_22050_32'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error(`❌ ElevenLabs TTS error for ${specialist.name}:`, error);
      throw error;
    }
  }

  async speakText(
    text: string,
    specialistId?: string,
    customVoiceId?: string,
    customSettings?: VoiceSettings
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopSpeaking();

      // Try ElevenLabs first
      if (this.apiKey) {
        try {
          const audioBuffer = await this.generateSpeech(text, specialistId, customVoiceId, customSettings);
          await this.playAudioBuffer(audioBuffer);
          return;
        } catch (elevenLabsError) {
          console.warn('⚠️ ElevenLabs TTS failed, falling back to Web Speech API:', elevenLabsError);
        }
      }

      // Fallback to Web Speech API
      await this.speakWithWebAPI(text, specialistId);

    } catch (error) {
      console.error('❌ Error in speakText:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  private async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Convert ArrayBuffer to blob
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create and play audio
        this.currentAudio = new Audio(audioUrl);
        this.isPlaying = true;

        // Set up event listeners
        this.currentAudio.addEventListener('ended', () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        });

        this.currentAudio.addEventListener('error', (e) => {
          console.error('❌ Audio playback error:', e);
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(e);
        });

        this.currentAudio.play();
      } catch (error) {
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  private async speakWithWebAPI(text: string, specialistId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const cleanedText = this.cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Enhanced voice selection based on specialist
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;

      // Voice preferences based on specialist
      const voicePreferences: Record<string, string[]> = {
        'dr-maya-wellness': ['Google UK English Female', 'Samantha', 'Karen', 'female'],
        'coach-alex-fitness': ['Google US English Male', 'Alex', 'Daniel', 'male'],
        'nutritionist-sarah': ['Google UK English Female', 'Victoria', 'Fiona', 'female'],
        'therapist-david': ['Google US English Male', 'Tom', 'Oliver', 'male'],
        'dr-lisa-relationships': ['Google UK English Female', 'Emma', 'Moira', 'female'],
        'dr-chen-purpose': ['Google US English Male', 'Alex', 'Daniel', 'male'],
        'default': ['Google UK English Female', 'Samantha', 'Karen', 'female']
      };

      const preferences = voicePreferences[specialistId || 'default'] || voicePreferences.default;

      // Try to find a good voice
      for (const pref of preferences) {
        selectedVoice = voices.find(voice =>
          voice.name.includes(pref) ||
          voice.name.toLowerCase().includes(pref.toLowerCase()) ||
          (pref === 'female' && voice.name.toLowerCase().includes('female')) ||
          (pref === 'male' && voice.name.toLowerCase().includes('male'))
        );
        if (selectedVoice) break;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        this.isPlaying = true;
        console.log('🔊 Web Speech API started speaking');
      };

      utterance.onend = () => {
        this.isPlaying = false;
        resolve();
      };

      utterance.onerror = (error) => {
        this.isPlaying = false;
        console.error('❌ Web Speech API error:', error);
        reject(error);
      };

      speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    // Stop ElevenLabs audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      this.currentAudio = null;
    }

    // Stop Web Speech API
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      this.isPlaying = false;
    }
  }

  isSpeaking(): boolean {
    return this.isPlaying || ('speechSynthesis' in window && speechSynthesis.speaking);
  }

  getSpecialist(specialistId: string): HealthSpecialist | null {
    return ElevenLabsVoiceService.HEALTH_SPECIALISTS[specialistId] || null;
  }

  getAllSpecialists(): HealthSpecialist[] {
    return Object.values(ElevenLabsVoiceService.HEALTH_SPECIALISTS);
  }

  getSpecialistVoices(specialistId: string): VoiceOption[] {
    const specialist = ElevenLabsVoiceService.HEALTH_SPECIALISTS[specialistId];
    return specialist ? specialist.voices : [];
  }

  getVoiceById(specialistId: string, voiceId: string): VoiceOption | undefined {
    const specialist = ElevenLabsVoiceService.HEALTH_SPECIALISTS[specialistId];
    return specialist ? specialist.voices.find(v => v.elevenlabs_voice_id === voiceId) : undefined;
  }

  public cleanTextForSpeech(text: string): string {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')

      // Replace common abbreviations
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bMr\./g, 'Mister')
      .replace(/\bMrs\./g, 'Mister')
      .replace(/\bMs\./g, 'Miss')
      .replace(/\betc\./g, 'etcetera')
      .replace(/\bi\.e\./g, 'that is')
      .replace(/\be\.g\./g, 'for example')

      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  async testVoice(specialistId?: string): Promise<boolean> {
    try {
      const specialist = this.getSpecialist(specialistId || 'dr-maya-wellness');
      const testText = `Hello! This is ${specialist?.name || 'your health coach'}. The voice system is working correctly.`;

      await this.speakText(testText, specialistId);
      return true;
    } catch (error) {
      console.error('❌ Voice test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const voiceService = new ElevenLabsVoiceService();