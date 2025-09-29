export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private isSupported = false;
  private callbacks?: {
    onResult: (transcript: string, isFinal: boolean, confidence: number) => void;
    onError: (error: string) => void;
    onStatus: (status: string) => void;
  };

  constructor() {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
      this.setupRecognition();
      console.log('🎤 Speech Recognition Service initialized successfully');
    } else {
      console.warn('⚠️ Speech Recognition not supported in this browser');
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  public startListening(
    onResult: (transcript: string, isInterim: boolean) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ): boolean {
    if (!this.isSupported || !this.recognition) {
      onError('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      console.warn('⚠️ Already listening');
      return false;
    }

    try {
      // Set up event handlers
      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('🎤 Speech recognition started');
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        let isInterim = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          transcript += result[0].transcript;

          if (!result.isFinal) {
            isInterim = true;
          }
        }

        onResult(transcript.trim(), isInterim);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('🔇 Speech recognition ended');
        onEnd();
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        console.error('❌ Speech recognition error:', event.error);
        onError(`Speech recognition error: ${event.error}`);
      };

      this.recognition.start();
      return true;
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      onError('Failed to start speech recognition');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isRecognitionSupported(): boolean {
    return this.isSupported;
  }

  public setCallbacks(
    onResult: (transcript: string, isFinal: boolean, confidence: number) => void,
    onError: (error: string) => void,
    onStatus: (status: string) => void
  ): void {
    this.callbacks = { onResult, onError, onStatus };
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();