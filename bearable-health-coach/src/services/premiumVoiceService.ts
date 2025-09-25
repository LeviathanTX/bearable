// Premium Voice Service using OpenAI TTS API
// Provides professional-grade voice synthesis for health coaching

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type EmotionalTone = 'supportive' | 'encouraging' | 'gentle' | 'understanding' | 'energetic' | 'calm';

export interface VoiceCharacter {
  name: string;
  openaiVoice: OpenAIVoice;
  personality: 'warm' | 'professional' | 'energetic' | 'calm';
  speed: number;
  emotionalRange: EmotionalTone[];
  conversationalStyle: 'formal' | 'casual' | 'therapeutic';
  description: string;
}

export interface VoiceGenerationOptions {
  character: VoiceCharacter;
  emotionalTone?: EmotionalTone;
  priority?: 'speed' | 'quality';
}

export class PremiumVoiceService {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private audioQueue: HTMLAudioElement[] = [];

  // Wellness Bear Voice Character - Optimized for health coaching
  public static readonly WELLNESS_BEAR: VoiceCharacter = {
    name: "Wellness Bear",
    openaiVoice: "nova", // Warm, caring female voice
    personality: "warm",
    speed: 0.85, // Slightly slower for health coaching
    emotionalRange: ["supportive", "encouraging", "gentle", "understanding"],
    conversationalStyle: "therapeutic",
    description: "A warm, nurturing voice perfect for health and wellness guidance"
  };

  // Alternative voice options for user preference
  public static readonly VOICE_OPTIONS: VoiceCharacter[] = [
    PremiumVoiceService.WELLNESS_BEAR,
    {
      name: "Professional Coach",
      openaiVoice: "echo",
      personality: "professional",
      speed: 0.9,
      emotionalRange: ["encouraging", "calm"],
      conversationalStyle: "formal",
      description: "Clear, professional voice for structured health guidance"
    },
    {
      name: "Energetic Companion",
      openaiVoice: "fable",
      personality: "energetic",
      speed: 1.0,
      emotionalRange: ["energetic", "encouraging"],
      conversationalStyle: "casual",
      description: "Upbeat, motivational voice to energize your wellness journey"
    },
    {
      name: "Calm Mentor",
      openaiVoice: "shimmer",
      personality: "calm",
      speed: 0.75,
      emotionalRange: ["gentle", "calm", "understanding"],
      conversationalStyle: "therapeutic",
      description: "Soothing, meditative voice for stress relief and mindfulness"
    }
  ];

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  // Enhanced text preprocessing for natural speech
  private enhanceTextForSpeech(text: string, emotionalTone: EmotionalTone = 'supportive'): string {
    let enhanced = text
      // Remove emojis completely
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Clean up formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/`(.*?)`/g, '$1') // Remove code formatting
      // Add natural pauses
      .replace(/\. /g, '. ') // Ensure period spacing
      .replace(/\n\n/g, '... ') // Double line breaks become pauses
      .replace(/\n/g, ', ') // Single line breaks become brief pauses
      .trim();

    // Add emotional context based on tone
    switch (emotionalTone) {
      case 'encouraging':
        // Slightly more upbeat delivery cues
        enhanced = enhanced.replace(/great|good|excellent|wonderful/gi, match => `${match}!`);
        break;
      case 'gentle':
        // Softer, more caring delivery
        enhanced = enhanced.replace(/\./g, '...');
        break;
      case 'energetic':
        // More dynamic delivery
        enhanced = enhanced.replace(/!/g, '!!');
        break;
    }

    return enhanced;
  }

  // Generate voice using OpenAI TTS API
  async generateVoice(
    text: string,
    options: VoiceGenerationOptions = { character: PremiumVoiceService.WELLNESS_BEAR }
  ): Promise<Blob> {
    const { character, emotionalTone = 'supportive', priority = 'quality' } = options;

    // Enhance text for natural speech
    const enhancedText = this.enhanceTextForSpeech(text, emotionalTone);

    // Note: API key is handled by the local server, not needed here

    try {
      console.log(`🎙️ Calling local voice API for: "${enhancedText.substring(0, 50)}..."`);

      const response = await fetch('http://localhost:3002/api/voice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: enhancedText,
          voice: character.openaiVoice,
          speed: character.speed,
          model: priority === 'quality' ? 'tts-1-hd' : 'tts-1',
          response_format: 'mp3'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Local voice API error:', response.status, errorText);
        throw new Error(`Voice generation failed: ${response.statusText} - ${errorText}`);
      }

      console.log(`✅ Premium voice generated successfully with ${character.openaiVoice} (speed: ${character.speed})`);
      return await response.blob();
    } catch (error) {
      console.error('Premium voice generation error:', error);
      throw error;
    }
  }

  // Play generated voice with enhanced audio management
  async playVoice(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        this.stopCurrentAudio();

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Configure audio for optimal playback
        audio.preload = 'auto';
        audio.volume = 0.95;

        // Event handlers
        audio.onloadeddata = () => {
          console.log('Audio loaded, duration:', audio.duration);
        };

        audio.onplay = () => {
          this.isPlaying = true;
          this.currentAudio = audio;
        };

        audio.onended = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };

        // Start playback
        audio.play().catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Combined generate and play method with fallback to browser voice
  async speak(
    text: string,
    options: VoiceGenerationOptions = { character: PremiumVoiceService.WELLNESS_BEAR }
  ): Promise<void> {
    try {
      console.log(`🎙️ Attempting premium voice: "${text.substring(0, 50)}..."`);

      const audioBlob = await this.generateVoice(text, options);
      console.log(`🔊 Playing premium voice (${Math.round(audioBlob.size / 1024)}KB)`);

      await this.playVoice(audioBlob);
    } catch (error) {
      console.warn('Premium voice failed, falling back to browser voice:', error);

      // Fallback to browser voice
      try {
        await this.speakWithBrowserVoice(text, options);
      } catch (fallbackError) {
        console.error('Both premium and browser voice failed:', fallbackError);
        throw new Error('Voice synthesis unavailable');
      }
    }
  }

  // Fallback browser voice method
  private async speakWithBrowserVoice(
    text: string,
    options: VoiceGenerationOptions
  ): Promise<void> {
    console.log(`🔊 Using browser voice fallback for: "${text.substring(0, 50)}..."`);

    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      window.speechSynthesis.cancel();

      // Enhanced text preprocessing for better browser voice
      const enhancedText = this.enhanceTextForSpeech(text, options.emotionalTone);
      const utterance = new SpeechSynthesisUtterance(enhancedText);

      // Configure for natural browser voice
      utterance.rate = Math.max(0.1, Math.min(2.0, options.character.speed * 0.8)); // Slower for browser voice
      utterance.pitch = 0.9; // Slightly lower pitch
      utterance.volume = 0.95;
      utterance.lang = 'en-US';

      // Try to get a good quality voice
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = this.getBestBrowserVoice(voices, options.character.personality);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        this.isPlaying = true;
      };

      utterance.onend = () => {
        this.isPlaying = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        reject(new Error(`Browser voice error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Get the best browser voice based on character personality
  private getBestBrowserVoice(voices: SpeechSynthesisVoice[], personality: string): SpeechSynthesisVoice | null {
    // Priority voices for different personalities
    const voicePreferences = {
      warm: ['Samantha', 'Ava', 'Susan', 'Karen', 'Allison', 'Google US English Female'],
      professional: ['Microsoft Jenny', 'Microsoft Aria', 'Google UK English Female'],
      energetic: ['Fable', 'Google AU English Female', 'Chrome OS US English Female'],
      calm: ['Shimmer', 'Nova', 'Allison', 'Google US English']
    };

    const preferred = voicePreferences[personality as keyof typeof voicePreferences] || voicePreferences.warm;

    for (const pref of preferred) {
      const voice = voices.find(v =>
        v.name.includes(pref) || v.name.toLowerCase().includes(pref.toLowerCase())
      );
      if (voice) {
        console.log(`🎯 Found preferred browser voice: ${voice.name}`);
        return voice;
      }
    }

    // Fallback to first female English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
    const femaleVoice = englishVoices.find(v =>
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('woman') ||
      ['samantha', 'ava', 'susan', 'karen', 'allison', 'jenny', 'aria'].some(name =>
        v.name.toLowerCase().includes(name)
      )
    );

    if (femaleVoice) {
      console.log(`🔄 Using fallback female voice: ${femaleVoice.name}`);
      return femaleVoice;
    }

    // Last resort - any English voice
    if (englishVoices.length > 0) {
      console.log(`⚠️ Using last resort voice: ${englishVoices[0].name}`);
      return englishVoices[0];
    }

    return null;
  }

  // Stop current audio playback (both premium and browser voice)
  stopCurrentAudio(): void {
    // Stop premium voice audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop browser voice synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
  }

  // Check if voice is currently playing
  isSpeaking(): boolean {
    return this.isPlaying;
  }

  // Test voice with sample phrase
  async testVoice(character: VoiceCharacter, customPhrase?: string): Promise<void> {
    const testPhrase = customPhrase ||
      `Hello! I'm ${character.name}, your AI health companion. I'm here to support you on your wellness journey with ${character.personality} guidance.`;

    await this.speak(testPhrase, { character });
  }

  // Get voice character recommendations based on user preferences
  getRecommendedVoice(preferences: {
    style?: 'calm' | 'energetic' | 'professional';
    purpose?: 'meditation' | 'motivation' | 'education';
  }): VoiceCharacter {
    const { style, purpose } = preferences;

    if (purpose === 'meditation' || style === 'calm') {
      return PremiumVoiceService.VOICE_OPTIONS.find(v => v.name === "Calm Mentor") || PremiumVoiceService.WELLNESS_BEAR;
    }

    if (purpose === 'motivation' || style === 'energetic') {
      return PremiumVoiceService.VOICE_OPTIONS.find(v => v.name === "Energetic Companion") || PremiumVoiceService.WELLNESS_BEAR;
    }

    if (style === 'professional') {
      return PremiumVoiceService.VOICE_OPTIONS.find(v => v.name === "Professional Coach") || PremiumVoiceService.WELLNESS_BEAR;
    }

    return PremiumVoiceService.WELLNESS_BEAR;
  }

  // Health coaching optimized speech
  async speakHealthTip(tip: string, emotionalTone: EmotionalTone = 'supportive'): Promise<void> {
    await this.speak(tip, {
      character: PremiumVoiceService.WELLNESS_BEAR,
      emotionalTone,
      priority: 'quality'
    });
  }

  // Encouraging response with dynamic tone
  async speakEncouragement(message: string): Promise<void> {
    await this.speak(message, {
      character: PremiumVoiceService.WELLNESS_BEAR,
      emotionalTone: 'encouraging',
      priority: 'speed' // Faster response for encouragement
    });
  }
}