// Advanced Conversational Voice Service
// Manages sophisticated voice interactions with natural conversation flow

import { PremiumVoiceService, VoiceCharacter, EmotionalTone } from './premiumVoiceService';
import { VoiceService } from './voiceService';

import { voicePreferences } from './voicePreferences';
export interface ConversationState {
  isActive: boolean;
  currentSpeaker: 'user' | 'assistant' | 'none';
  turnCount: number;
  conversationId: string;
  context: ConversationContext;
  voiceSession: VoiceSession;
}

export interface ConversationContext {
  topic: string;
  emotionalTone: EmotionalTone;
  userEngagement: 'high' | 'medium' | 'low';
  conversationStyle: 'coaching' | 'educational' | 'supportive' | 'casual';
  urgency: 'low' | 'normal' | 'high';
  lastUserInput: Date;
  interruptionCount: number;
}

export interface VoiceSession {
  startTime: Date;
  totalDuration: number;
  speakingDuration: number;
  listeningDuration: number;
  turnTransitions: number;
  averageResponseTime: number;
  qualityMetrics: VoiceQualityMetrics;
}

export interface VoiceQualityMetrics {
  speechRecognitionAccuracy: number;
  voiceClarity: number;
  conversationalFlow: number;
  userSatisfaction?: number;
}

export interface VoiceActivityState {
  isUserSpeaking: boolean;
  isAssistantSpeaking: boolean;
  silenceDuration: number;
  voiceLevel: number;
  backgroundNoise: number;
}

export interface ConversationOptions {
  maxTurnDuration: number; // milliseconds
  silenceTimeoutUser: number; // milliseconds before assuming user finished
  silenceTimeoutAssistant: number; // milliseconds before allowing interruption
  enableInterruptions: boolean;
  adaptivePacing: boolean;
  emotionalAdaptation: boolean;
  conversationStyle: ConversationContext['conversationStyle'];
}

export class ConversationalVoiceService {
  private conversationState: ConversationState | null = null;
  private voiceActivity: VoiceActivityState;
  private premiumVoiceService: PremiumVoiceService;
  private fallbackVoiceService: VoiceService;
  private audioContext: AudioContext | null = null;
  private microphoneStream: MediaStream | null = null;
  private voiceActivityDetector: any = null; // Will implement VAD
  private conversationTimer: NodeJS.Timeout | null = null;
  private options: ConversationOptions;

  // Event handlers
  private onConversationStateChange?: (state: ConversationState) => void;
  private onVoiceActivityChange?: (activity: VoiceActivityState) => void;
  private onTurnTransition?: (from: 'user' | 'assistant', to: 'user' | 'assistant') => void;
  private onError?: (error: string, context?: any) => void;

  constructor(options: Partial<ConversationOptions> = {}) {
    // Load saved preferences for pacing
    const savedPacing = voicePreferences.getConversationPacing();

    this.options = {
      // Optimized defaults for health coaching conversations
      maxTurnDuration: savedPacing.maxTurnDuration || 45000, // 45s allows thoughtful responses
      silenceTimeoutUser: savedPacing.silenceTimeoutUser || 2500, // 2.5s gives time to think
      silenceTimeoutAssistant: 1200, // 1.2s - quick enough to feel responsive
      enableInterruptions: savedPacing.enableInterruptions ?? true, // Natural conversation flow
      adaptivePacing: savedPacing.adaptivePacing ?? true, // Adjust to user engagement
      emotionalAdaptation: true, // Always adapt tone to context
      conversationStyle: 'coaching', // Default to coaching style
      ...options
    };

    this.premiumVoiceService = new PremiumVoiceService();
    this.fallbackVoiceService = new VoiceService();

    this.voiceActivity = {
      isUserSpeaking: false,
      isAssistantSpeaking: false,
      silenceDuration: 0,
      voiceLevel: 0,
      backgroundNoise: 0
    };

    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
    }
  }

  // Start advanced conversational voice session
  async startConversation(
    character: VoiceCharacter,
    initialContext: Partial<ConversationContext> = {},
    options: Partial<ConversationOptions> = {}
  ): Promise<ConversationState> {
    try {
      // Merge options
      this.options = { ...this.options, ...options };

      // Initialize conversation state
      this.conversationState = {
        isActive: true,
        currentSpeaker: 'none',
        turnCount: 0,
        conversationId: `conv_${Date.now()}`,
        context: {
          topic: 'health_coaching',
          emotionalTone: 'supportive',
          userEngagement: 'medium',
          conversationStyle: this.options.conversationStyle,
          urgency: 'normal',
          lastUserInput: new Date(),
          interruptionCount: 0,
          ...initialContext
        },
        voiceSession: {
          startTime: new Date(),
          totalDuration: 0,
          speakingDuration: 0,
          listeningDuration: 0,
          turnTransitions: 0,
          averageResponseTime: 0,
          qualityMetrics: {
            speechRecognitionAccuracy: 0.9,
            voiceClarity: 0.85,
            conversationalFlow: 0.8
          }
        }
      };

      // Start microphone access for voice activity detection
      await this.initializeMicrophone();

      // Start voice activity monitoring
      this.startVoiceActivityDetection();

      // Start conversation monitoring timer
      this.startConversationMonitoring();

      console.log('🎙️ Advanced conversational voice session started:', this.conversationState.conversationId);

      this.notifyStateChange();
      return this.conversationState;

    } catch (error) {
      console.error('Failed to start conversation:', error);
      this.onError?.('Failed to start conversation', error);
      throw error;
    }
  }

  // Enhanced listening with conversation awareness
  async startListening(
    onTranscript: (transcript: string, isFinal: boolean, confidence: number) => void,
    onComplete: (transcript: string) => void
  ): Promise<void> {
    if (!this.conversationState?.isActive) {
      throw new Error('No active conversation session');
    }

    // Check if assistant is speaking and handle interruption
    if (this.conversationState.currentSpeaker === 'assistant') {
      if (this.options.enableInterruptions) {
        console.log('👂 User interrupting assistant - allowing takeover');
        await this.handleInterruption();
      } else {
        console.log('🚫 Interruptions disabled - waiting for assistant to finish');
        return;
      }
    }

    // Transition to user turn
    this.transitionTurn('user');

    let silenceTimer: NodeJS.Timeout | null = null;
    let turnTimer: NodeJS.Timeout | null = null;
    let lastTranscript = '';
    let confidenceSum = 0;
    let transcriptCount = 0;

    try {
      // Start enhanced voice recognition
      await this.fallbackVoiceService.startListening(
        (result) => {
          const { transcript, confidence, isFinal } = result;

          // Update quality metrics
          confidenceSum += confidence;
          transcriptCount++;
          if (this.conversationState) {
            this.conversationState.voiceSession.qualityMetrics.speechRecognitionAccuracy =
              confidenceSum / transcriptCount;
          }

          // Reset silence timer on new input
          if (transcript.trim() !== lastTranscript.trim()) {
            this.voiceActivity.silenceDuration = 0;
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
          }

          lastTranscript = transcript;
          onTranscript(transcript, isFinal, confidence);

          // Handle final result
          if (isFinal && transcript.trim()) {
            console.log('✅ Final transcript received:', transcript);
            this.cleanupListening(silenceTimer, turnTimer);
            this.updateConversationMetrics('user_turn_complete');
            onComplete(transcript.trim());
          } else if (!isFinal) {
            // Start silence detection timer for interim results
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
              console.log('⏰ User silence timeout - completing turn');
              this.fallbackVoiceService.stopListening();
              this.cleanupListening(silenceTimer, turnTimer);
              if (lastTranscript.trim()) {
                this.updateConversationMetrics('user_turn_timeout');
                onComplete(lastTranscript.trim());
              }
            }, this.options.silenceTimeoutUser);
          }
        },
        (error) => {
          console.error('Enhanced listening error:', error);
          this.cleanupListening(silenceTimer, turnTimer);
          this.onError?.('Voice recognition error', error);
        },
        () => {
          console.log('🎤 Enhanced listening started');
          this.voiceActivity.isUserSpeaking = true;
          this.notifyActivityChange();

          // Set maximum turn duration
          turnTimer = setTimeout(() => {
            console.log('⏰ Maximum turn duration reached');
            this.fallbackVoiceService.stopListening();
            this.cleanupListening(silenceTimer, turnTimer);
            if (lastTranscript.trim()) {
              this.updateConversationMetrics('user_turn_max_duration');
              onComplete(lastTranscript.trim());
            }
          }, this.options.maxTurnDuration);
        },
        () => {
          console.log('🎤 Enhanced listening ended');
          this.voiceActivity.isUserSpeaking = false;
          this.notifyActivityChange();
          this.cleanupListening(silenceTimer, turnTimer);
        }
      );

    } catch (error) {
      this.cleanupListening(silenceTimer, turnTimer);
      throw error;
    }
  }

  // Enhanced speaking with conversation awareness
  async speak(
    text: string,
    character: VoiceCharacter,
    contextualTone?: EmotionalTone
  ): Promise<void> {
    if (!this.conversationState?.isActive) {
      throw new Error('No active conversation session');
    }

    // Transition to assistant turn
    this.transitionTurn('assistant');

    // Adapt tone based on conversation context
    const adaptedTone = this.adaptEmotionalTone(contextualTone);

    // Adapt speaking rate based on context
    const adaptedCharacter = this.adaptSpeakingStyle(character);

    const startTime = Date.now();

    try {
      console.log(`🗣️ Assistant speaking with adapted tone: ${adaptedTone}`);

      // Try premium voice first, fallback to browser voice
      try {
        await this.premiumVoiceService.speak(text, {
          character: adaptedCharacter,
          emotionalTone: adaptedTone,
          priority: 'quality'
        });
        console.log('✅ Premium voice completed');
      } catch (premiumError) {
        console.warn('Premium voice failed, using fallback:', premiumError);
        await this.fallbackVoiceService.speakHealthTip(text);
        console.log('✅ Fallback voice completed');
      }

      const duration = Date.now() - startTime;
      this.updateSpeakingMetrics(duration);

      // Small pause after speaking to allow natural conversation flow
      await this.naturalPause();

      // Transition back to listening mode
      this.transitionTurn('none');

    } catch (error) {
      console.error('Enhanced speaking error:', error);
      this.transitionTurn('none');
      this.onError?.('Voice synthesis error', error);
      throw error;
    }
  }

  // Handle voice interruptions gracefully
  private async handleInterruption(): Promise<void> {
    if (!this.conversationState) return;

    console.log('🔄 Handling voice interruption');

    // Stop current speech
    this.premiumVoiceService.stopCurrentAudio();
    this.fallbackVoiceService.stopSpeaking();

    // Update interruption count
    this.conversationState.context.interruptionCount++;

    // Adapt to interruption - user might be urgent or engaged
    if (this.conversationState.context.interruptionCount > 2) {
      this.conversationState.context.userEngagement = 'high';
      this.conversationState.context.urgency = 'high';
    }

    // Brief pause to allow clean transition
    await new Promise(resolve => setTimeout(resolve, 200));

    this.notifyStateChange();
  }

  // Adaptive emotional tone based on conversation context
  private adaptEmotionalTone(requestedTone?: EmotionalTone): EmotionalTone {
    if (!this.options.emotionalAdaptation || !this.conversationState) {
      return requestedTone || 'supportive';
    }

    const context = this.conversationState.context;

    // Adapt based on urgency
    if (context.urgency === 'high') {
      return 'calm';
    }

    // Adapt based on user engagement
    if (context.userEngagement === 'low') {
      return 'encouraging';
    }

    // Adapt based on interruption count
    if (context.interruptionCount > 1) {
      return 'understanding';
    }

    return requestedTone || context.emotionalTone;
  }

  // Adaptive speaking style based on conversation flow
  private adaptSpeakingStyle(character: VoiceCharacter): VoiceCharacter {
    if (!this.options.adaptivePacing || !this.conversationState) {
      return character;
    }

    const adaptedCharacter = { ...character };
    const context = this.conversationState.context;

    // Slow down for low engagement
    if (context.userEngagement === 'low') {
      adaptedCharacter.speed = Math.max(0.6, character.speed - 0.1);
    }

    // Speed up slightly for high engagement
    if (context.userEngagement === 'high') {
      adaptedCharacter.speed = Math.min(1.0, character.speed + 0.05);
    }

    // Slow down for high urgency (counterintuitive but calming)
    if (context.urgency === 'high') {
      adaptedCharacter.speed = Math.max(0.7, character.speed - 0.05);
    }

    return adaptedCharacter;
  }

  // Natural pause between speech segments
  private async naturalPause(): Promise<void> {
    const pauseDuration = this.conversationState?.context.urgency === 'high' ? 300 : 500;
    await new Promise(resolve => setTimeout(resolve, pauseDuration));
  }

  // Transition between speakers
  private transitionTurn(newSpeaker: 'user' | 'assistant' | 'none'): void {
    if (!this.conversationState) return;

    const previousSpeaker = this.conversationState.currentSpeaker;

    if (previousSpeaker !== newSpeaker) {
      this.conversationState.currentSpeaker = newSpeaker;
      this.conversationState.turnCount++;
      this.conversationState.voiceSession.turnTransitions++;

      console.log(`🔄 Turn transition: ${previousSpeaker} → ${newSpeaker} (Turn ${this.conversationState.turnCount})`);

      if (previousSpeaker !== 'none' && newSpeaker !== 'none') {
        this.onTurnTransition?.(previousSpeaker, newSpeaker);
      }

      this.notifyStateChange();
    }
  }

  // Initialize microphone for voice activity detection
  private async initializeMicrophone(): Promise<void> {
    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('🎤 Microphone initialized for voice activity detection');
    } catch (error) {
      console.warn('Microphone access failed:', error);
    }
  }

  // Start voice activity detection
  private startVoiceActivityDetection(): void {
    if (!this.audioContext || !this.microphoneStream) return;

    try {
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVoiceActivity = () => {
        if (!this.conversationState?.isActive) return;

        analyser.getByteFrequencyData(dataArray);

        // Calculate voice level
        const sum = dataArray.reduce((a, b) => a + b, 0);
        this.voiceActivity.voiceLevel = sum / bufferLength;

        // Simple voice activity detection (can be enhanced)
        const isVoiceDetected = this.voiceActivity.voiceLevel > 30;

        if (isVoiceDetected !== this.voiceActivity.isUserSpeaking) {
          this.voiceActivity.isUserSpeaking = isVoiceDetected;
          this.notifyActivityChange();
        }

        setTimeout(checkVoiceActivity, 100);
      };

      checkVoiceActivity();
      console.log('👂 Voice activity detection started');

    } catch (error) {
      console.warn('Voice activity detection setup failed:', error);
    }
  }

  // Start conversation monitoring
  private startConversationMonitoring(): void {
    this.conversationTimer = setInterval(() => {
      if (!this.conversationState?.isActive) return;

      const now = Date.now();
      const startTime = this.conversationState.voiceSession.startTime.getTime();
      this.conversationState.voiceSession.totalDuration = now - startTime;

      // Update silence duration
      if (this.conversationState.currentSpeaker === 'none') {
        this.voiceActivity.silenceDuration += 1000;
      } else {
        this.voiceActivity.silenceDuration = 0;
      }

      // Check for conversation timeout or quality degradation
      this.checkConversationHealth();

    }, 1000);
  }

  // Monitor conversation health and quality
  private checkConversationHealth(): void {
    if (!this.conversationState) return;

    const session = this.conversationState.voiceSession;
    const context = this.conversationState.context;

    // Check for long periods of inactivity
    if (this.voiceActivity.silenceDuration > 30000) { // 30 seconds
      console.warn('⚠️ Long conversation silence detected');
      context.userEngagement = 'low';
    }

    // Check turn balance
    const avgResponseTime = session.totalDuration / (session.turnTransitions || 1);
    session.averageResponseTime = avgResponseTime;

    // Adapt conversation style based on patterns
    if (context.interruptionCount > 3 && session.turnTransitions > 5) {
      context.conversationStyle = 'casual'; // More natural for frequent interruptions
    }
  }

  // Update conversation metrics
  private updateConversationMetrics(event: string): void {
    if (!this.conversationState) return;

    console.log(`📊 Conversation metric: ${event}`);

    // Update context based on events
    switch (event) {
      case 'user_turn_complete':
        this.conversationState.context.lastUserInput = new Date();
        this.conversationState.context.userEngagement = 'medium';
        break;
      case 'user_turn_timeout':
        // User might be thinking or having trouble
        if (this.conversationState.context.userEngagement !== 'low') {
          this.conversationState.context.userEngagement = 'medium';
        }
        break;
      case 'user_turn_max_duration':
        // User is very engaged
        this.conversationState.context.userEngagement = 'high';
        break;
    }

    this.notifyStateChange();
  }

  // Update speaking duration metrics
  private updateSpeakingMetrics(duration: number): void {
    if (!this.conversationState) return;

    this.conversationState.voiceSession.speakingDuration += duration;

    // Update voice clarity based on successful completion
    const currentClarity = this.conversationState.voiceSession.qualityMetrics.voiceClarity;
    this.conversationState.voiceSession.qualityMetrics.voiceClarity =
      Math.min(0.95, currentClarity + 0.01);
  }

  // Clean up listening timers and state
  private cleanupListening(
    silenceTimer: NodeJS.Timeout | null,
    turnTimer: NodeJS.Timeout | null
  ): void {
    if (silenceTimer) clearTimeout(silenceTimer);
    if (turnTimer) clearTimeout(turnTimer);
    this.voiceActivity.isUserSpeaking = false;
    this.notifyActivityChange();
  }

  // Stop conversation
  async stopConversation(): Promise<VoiceSession | null> {
    if (!this.conversationState?.isActive) return null;

    console.log('🛑 Stopping advanced conversation session');

    // Stop all voice activities
    this.premiumVoiceService.stopCurrentAudio();
    this.fallbackVoiceService.stopSpeaking();
    this.fallbackVoiceService.stopListening();

    // Stop monitoring
    if (this.conversationTimer) {
      clearInterval(this.conversationTimer);
      this.conversationTimer = null;
    }

    // Clean up microphone
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    // Finalize session metrics
    const session = this.conversationState.voiceSession;
    const now = Date.now();
    session.totalDuration = now - session.startTime.getTime();

    // Calculate conversation flow quality
    session.qualityMetrics.conversationalFlow =
      Math.max(0.3, 1.0 - (this.conversationState.context.interruptionCount * 0.1));

    this.conversationState.isActive = false;
    this.notifyStateChange();

    const finalSession = { ...session };
    this.conversationState = null;

    return finalSession;
  }

  // Event handler setters
  setOnConversationStateChange(handler: (state: ConversationState) => void): void {
    this.onConversationStateChange = handler;
  }

  setOnVoiceActivityChange(handler: (activity: VoiceActivityState) => void): void {
    this.onVoiceActivityChange = handler;
  }

  setOnTurnTransition(handler: (from: 'user' | 'assistant', to: 'user' | 'assistant') => void): void {
    this.onTurnTransition = handler;
  }

  setOnError(handler: (error: string, context?: any) => void): void {
    this.onError = handler;
  }

  // Notification methods
  private notifyStateChange(): void {
    if (this.conversationState && this.onConversationStateChange) {
      this.onConversationStateChange({ ...this.conversationState });
    }
  }

  private notifyActivityChange(): void {
    if (this.onVoiceActivityChange) {
      this.onVoiceActivityChange({ ...this.voiceActivity });
    }
  }

  // Getters
  getCurrentState(): ConversationState | null {
    return this.conversationState ? { ...this.conversationState } : null;
  }

  getVoiceActivity(): VoiceActivityState {
    return { ...this.voiceActivity };
  }

  isConversationActive(): boolean {
    return this.conversationState?.isActive || false;
  }
}