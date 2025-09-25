// Voice Service for Speech Recognition and Text-to-Speech
// Uses Web Speech API (built into modern browsers)

export interface VoiceConfig {
  language: string;
  voiceURI?: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceService {
  private speechRecognition: any = null;
  private speechSynthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListening = false;
  private voices: SpeechSynthesisVoice[] = [];

  // Clean and humanize text for natural speech synthesis
  private cleanTextForSpeech(text: string): string {
    return text
      // Remove emojis (most comprehensive regex for emojis)
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Replace bullet points with more natural speech
      .replace(/•\s*/g, '. Let me mention, ')
      .replace(/→/g, ' leads to ')
      .replace(/✓/g, ' that\'s right ')
      .replace(/❌/g, ' that\'s not recommended ')
      .replace(/⚠️/g, ' please note ')
      // Make numbered lists more conversational
      .replace(/(\d+)\./g, 'Number $1,')
      .replace(/^(\d+):/gm, 'Point $1:')
      // Add natural breathing pauses and conversational flow
      .replace(/\n\n/g, '... ')
      .replace(/\n-/g, ', also')
      .replace(/\n/g, '... ')
      .replace(/\. /g, '. ')
      .replace(/: /g, ', that is, ')
      .replace(/; /g, ', and also, ')
      // Add conversational fillers for naturalness
      .replace(/Additionally,/gi, 'Also,')
      .replace(/Furthermore,/gi, 'And,')
      .replace(/However,/gi, 'But,')
      .replace(/Therefore,/gi, 'So,')
      // Clean up extra whitespace and fix punctuation
      .replace(/\s+/g, ' ')
      .replace(/\.\.\.,/g, ',')
      .replace(/,,/g, ',')
      .replace(/,\./g, '.')
      .replace(/\.\./g, '.')
      .trim();
  }

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.loadVoices();
  }

  private initializeSpeechRecognition() {
    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
      this.speechRecognition.maxAlternatives = 1;
    }
  }

  private loadVoices() {
    // Load available voices
    this.voices = this.speechSynthesis.getVoices();

    // If voices aren't loaded yet, wait for them
    if (this.voices.length === 0) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.voices = this.speechSynthesis.getVoices();
      };
    }
  }

  // Check if voice features are supported
  isSpeechRecognitionSupported(): boolean {
    return this.speechRecognition !== null;
  }

  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  // Get available voices
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  // Get the most human-sounding voice for health coaching
  getDefaultVoice(): SpeechSynthesisVoice | null {
    // Ultra-priority: Most human-sounding voices first
    const ultraNaturalVoices = [
      // iOS/macOS Neural/Enhanced voices (most human)
      'Samantha (Enhanced)', 'Allison (Enhanced)', 'Ava (Enhanced)', 'Susan (Enhanced)',
      'Victoria (Enhanced)', 'Karen (Enhanced)',
      // Google's premium neural voices
      'Google US English Female', 'Google US English',
      'Chrome OS US English Female', 'Chrome OS English Female',
      // Windows Neural voices
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Aria - English (United States)',
      'Microsoft Jenny - English (United States)'
    ];

    // High-priority: Standard quality but warm voices
    const warmVoices = [
      'Samantha', 'Allison', 'Ava', 'Susan', 'Victoria', 'Karen',
      'Microsoft Zira - English (United States)',
      'Google UK English Female', 'Google AU English Female'
    ];

    // Search for ultra-natural voices first
    for (const voiceName of ultraNaturalVoices) {
      const voice = this.voices.find(v =>
        v.name.includes(voiceName) ||
        v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
        (voiceName.includes('Google') && v.name.includes('Google')) ||
        (voiceName.includes('Microsoft') && v.name.includes('Microsoft'))
      );
      if (voice) {
        console.log(`🎯 Found ultra-natural voice: ${voice.name}`);
        return voice;
      }
    }

    // Then try warm, human-sounding voices
    for (const voiceName of warmVoices) {
      const voice = this.voices.find(v =>
        v.name.includes(voiceName) || v.name.toLowerCase().includes(voiceName.toLowerCase())
      );
      if (voice) {
        console.log(`🔥 Found warm voice: ${voice.name}`);
        return voice;
      }
    }

    // Look for any neural/enhanced/natural voices
    const enhancedVoices = this.voices.filter(voice =>
      voice.name.toLowerCase().includes('neural') ||
      voice.name.toLowerCase().includes('enhanced') ||
      voice.name.toLowerCase().includes('natural') ||
      voice.name.toLowerCase().includes('premium') ||
      voice.name.toLowerCase().includes('online')
    );

    if (enhancedVoices.length > 0) {
      console.log(`⭐ Found enhanced voice: ${enhancedVoices[0].name}`);
      return enhancedVoices[0];
    }

    // Fallback: Local English voices
    const localEnglish = this.voices.filter(voice =>
      voice.lang.startsWith('en-') && voice.localService
    );

    if (localEnglish.length > 0) {
      console.log(`📍 Using local voice: ${localEnglish[0].name}`);
      return localEnglish[0];
    }

    // Last resort
    if (this.voices.length > 0) {
      console.log(`⚠️ Using fallback voice: ${this.voices[0].name}`);
      return this.voices[0];
    }

    return null;
  }

  // Text-to-Speech
  async speak(
    text: string,
    config?: Partial<VoiceConfig>,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    if (!this.isSpeechSynthesisSupported()) {
      throw new Error('Speech synthesis not supported');
    }

    // Stop any current speech
    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      // Clean text before speaking
      const cleanText = this.cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Configure voice settings for human-like speech
      utterance.rate = config?.rate || 0.75; // Much slower, conversational pace
      utterance.pitch = config?.pitch || 0.88; // Lower pitch for warmth and authority
      utterance.volume = config?.volume || 0.95;
      utterance.lang = config?.language || 'en-US';

      // Set voice
      const voice = this.getDefaultVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Event handlers
      utterance.onstart = () => {
        this.currentUtterance = utterance;
        onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        onError?.(event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Speak the text
      this.speechSynthesis.speak(utterance);
    });
  }

  // Stop current speech immediately
  stopSpeaking(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  // Pause current speech (if supported)
  pauseSpeaking(): void {
    if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
      this.speechSynthesis.pause();
    }
  }

  // Resume paused speech
  resumeSpeaking(): void {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
    }
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.speechSynthesis.speaking;
  }

  // Speech Recognition
  async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: any) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      this.stopListening();
    }

    return new Promise((resolve, reject) => {
      this.speechRecognition.onstart = () => {
        this.isListening = true;
        onStart?.();
        resolve();
      };

      this.speechRecognition.onresult = (event: any) => {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult) {
          const transcript = lastResult[0].transcript;
          const confidence = lastResult[0].confidence || 0.8;
          const isFinal = lastResult.isFinal;

          onResult({
            transcript: transcript.trim(),
            confidence,
            isFinal
          });
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        this.isListening = false;
        onError?.(event.error);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.speechRecognition.onend = () => {
        this.isListening = false;
        onEnd?.();
      };

      this.speechRecognition.start();
    });
  }

  // Stop listening
  stopListening(): void {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    }
  }

  // Check if currently listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Request microphone permissions
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  // Get browser compatibility info
  getCompatibilityInfo(): {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    mediaDevices: boolean;
    browser: string;
  } {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    return {
      speechRecognition: this.isSpeechRecognitionSupported(),
      speechSynthesis: this.isSpeechSynthesisSupported(),
      mediaDevices: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      browser
    };
  }

  // Get current voice information for debugging
  getCurrentVoiceInfo(): { name: string; lang: string; localService: boolean } | null {
    const voice = this.getDefaultVoice();
    if (voice) {
      return {
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService
      };
    }
    return null;
  }

  // List all available voices for debugging
  getAllVoicesInfo(): Array<{ name: string; lang: string; localService: boolean }> {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService
    }));
  }

  // Health coaching specific utility methods

  // Speak a health tip with human-like delivery
  async speakHealthTip(tip: string): Promise<void> {
    // Don't add introduction - just speak the cleaned tip directly
    return this.speak(tip, {
      rate: 0.7, // Very slow, like a caring friend explaining
      pitch: 0.85, // Warm, nurturing tone
      volume: 0.95
    });
  }

  // Speak encouragement with upbeat, human tone
  async speakEncouragement(message: string): Promise<void> {
    return this.speak(message, {
      rate: 0.8, // Measured, encouraging pace
      pitch: 0.92, // Slightly higher but still warm
      volume: 0.95
    });
  }

  // Create a listening session optimized for health conversations
  async startHealthConversation(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const hasPermission = await this.requestMicrophonePermission();

    if (!hasPermission) {
      onError?.('Microphone permission required for voice interaction');
      return;
    }

    return this.startListening(
      (result) => {
        onTranscript(result.transcript, result.isFinal);
      },
      (error) => {
        onError?.(`Voice recognition error: ${error}`);
      },
      () => {
        // Started listening
        console.log('Started listening for health conversation');
      },
      () => {
        // Ended listening
        console.log('Ended listening');
      }
    );
  }
}