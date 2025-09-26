// OpenAI Realtime API Service - True Conversational Voice AI
// Provides ultra-low latency bidirectional audio streaming for natural conversation

import { AIService } from './aiService';

export interface RealtimeConfig {
  apiKey: string;
  model: 'gpt-4o-realtime-preview-2024-10-01';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions: string;
  turn_detection: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  input_audio_format: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  input_audio_transcription?: {
    model: 'whisper-1';
  };
}

export interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: any;
}

export interface ConversationItem {
  id: string;
  type: 'message' | 'function_call' | 'function_call_output';
  status: 'completed' | 'in_progress' | 'incomplete';
  role: 'user' | 'assistant' | 'system';
  content?: Array<{
    type: 'input_text' | 'input_audio' | 'text' | 'audio';
    text?: string;
    audio?: string; // base64 encoded
    transcript?: string;
  }>;
}

export class RealtimeVoiceService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private connected: boolean = false;
  private recording: boolean = false;
  private conversationItems: ConversationItem[] = [];

  // Callbacks
  private onTranscriptCallback?: (text: string, isFinal: boolean) => void;
  private onResponseCallback?: (text: string) => void;
  private onAudioCallback?: (audioData: ArrayBuffer) => void;
  private onErrorCallback?: (error: string) => void;
  private onStatusCallback?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

  // Audio streaming
  private audioQueue: Float32Array[] = [];
  private isPlayingAudio: boolean = false;
  private currentAudioSource: AudioBufferSourceNode | null = null;

  // Voice Activity Detection
  private vadThreshold: number = 0.01;
  private silenceDuration: number = 1500; // ms
  private lastSpeechTime: number = 0;

  constructor(private config: RealtimeConfig) {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // OpenAI Realtime prefers 24kHz
        latencyHint: 'interactive'
      });

      console.log('🎵 Audio context initialized for Realtime API');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  // Connect to OpenAI Realtime API via WebSocket
  async connect(): Promise<void> {
    if (this.connected) {
      console.warn('Already connected to Realtime API');
      return;
    }

    try {
      this.onStatusCallback?.(('connecting'));
      console.log('🔗 Connecting to OpenAI Realtime API...');

      // Use our proxy server to handle WebSocket connection
      const wsUrl = process.env.NODE_ENV === 'production'
        ? `wss://bearable-production.up.railway.app/realtime`
        : `ws://localhost:3002/realtime`;

      console.log('🔗 Attempting to connect to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket opened - Connected to proxy server');
        this.connected = true;
        this.onStatusCallback?.(('connected'));
        console.log('🎯 Initializing session...');
        this.initializeSession();
      };

      this.ws.onmessage = (event) => {
        try {
          // Check if the data is a Blob (binary audio data)
          if (event.data instanceof Blob) {
            console.log('🎵 Received audio data from OpenAI Realtime API');
            this.handleAudioData(event.data);
          } else {
            // Handle JSON messages
            const data = typeof event.data === 'string' ? event.data : event.data.toString();
            console.log('📨 Received message from server:', data.substring(0, 200) + '...');
            this.handleRealtimeEvent(JSON.parse(data));
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.log('Raw message data:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason given'}`);
        console.log(`🔍 Was clean close: ${event.wasClean}`);
        this.connected = false;
        this.onStatusCallback?.(('disconnected'));
        this.cleanup();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error event:', error);
        console.warn('🔄 Realtime API unavailable - this usually means the backend server is not deployed');
        console.info('💡 The app will still work with basic voice features using browser TTS/STT');
        this.onStatusCallback?.(('error'));
        this.onErrorCallback?.('Realtime API server unavailable - using basic voice fallback');
      };

    } catch (error) {
      console.error('Failed to connect to Realtime API:', error);
      this.onErrorCallback?.(`Connection failed: ${error}`);
      this.onStatusCallback?.(('error'));
    }
  }

  // Initialize session with health coaching configuration
  private initializeSession() {
    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: this.config.input_audio_format,
        output_audio_format: this.config.output_audio_format,
        input_audio_transcription: this.config.input_audio_transcription,
        turn_detection: this.config.turn_detection,
        tools: [],
        tool_choice: 'auto',
        temperature: 0.7,
        max_response_output_tokens: 4096
      }
    };

    this.sendEvent(sessionConfig);
    console.log('🎯 Session initialized with health coaching configuration');
  }

  // Start conversational interaction
  async startConversation(
    onTranscript: (text: string, isFinal: boolean) => void,
    onResponse: (text: string) => void,
    onAudio: (audioData: ArrayBuffer) => void,
    onError: (error: string) => void,
    onStatus?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  ): Promise<void> {
    this.onTranscriptCallback = onTranscript;
    this.onResponseCallback = onResponse;
    this.onAudioCallback = onAudio;
    this.onErrorCallback = onError;
    this.onStatusCallback = onStatus;

    try {
      if (!this.connected) {
        await this.connect();
      }

      // Don't fail the entire connection if audio capture fails
      try {
        await this.startAudioCapture();
      } catch (audioError) {
        console.warn('⚠️ Audio capture failed, but WebSocket connection maintained:', audioError);
        this.onErrorCallback?.(`Audio capture failed: ${audioError}. You can still use text mode.`);
      }
    } catch (connectionError) {
      console.error('❌ Failed to start conversation:', connectionError);
      this.onErrorCallback?.(`Connection failed: ${connectionError}`);
      throw connectionError;
    }
  }

  // Start audio input capture with Voice Activity Detection
  private async startAudioCapture(): Promise<void> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎤 Microphone access granted for Realtime API');

      // Create audio worklet for real-time processing
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'realtime-processor');

      // Connect audio pipeline
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.audioWorkletNode);

      // Handle processed audio data
      this.audioWorkletNode.port.onmessage = (event) => {
        const { type, data } = event.data;

        if (type === 'audio') {
          this.sendAudioData(data);
        } else if (type === 'vad') {
          this.handleVoiceActivity(data);
        }
      };

      this.recording = true;
      console.log('🔊 Audio capture started with VAD');

    } catch (error) {
      console.error('Failed to start audio capture:', error);
      this.onErrorCallback?.(`Audio capture failed: ${error}`);
    }
  }

  // Send audio data to Realtime API
  private sendAudioData(audioData: Float32Array) {
    if (!this.connected || !this.ws) return;

    // Convert Float32Array to base64 PCM16
    const pcm16 = this.float32ToPCM16(audioData);
    const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

    const audioEvent = {
      type: 'input_audio_buffer.append',
      audio: base64Audio
    };

    this.sendEvent(audioEvent);
  }

  // Handle voice activity detection
  private handleVoiceActivity(vadData: { isSpeaking: boolean, energy: number }) {
    if (vadData.isSpeaking) {
      this.lastSpeechTime = Date.now();
    } else {
      const silenceTime = Date.now() - this.lastSpeechTime;
      if (silenceTime > this.silenceDuration && this.lastSpeechTime > 0) {
        // User has stopped speaking, commit the audio buffer
        this.commitAudioBuffer();
      }
    }
  }

  // Commit audio buffer for processing
  private commitAudioBuffer() {
    if (!this.connected || !this.ws) return;

    const commitEvent = {
      type: 'input_audio_buffer.commit'
    };

    this.sendEvent(commitEvent);
    console.log('🎯 Audio buffer committed for processing');
  }

  // Handle incoming Realtime API events
  private handleRealtimeEvent(event: RealtimeEvent) {
    console.log('📥 Realtime event:', event.type, event);

    switch (event.type) {
      case 'session.created':
        console.log('✅ Realtime session created');
        break;

      case 'session.updated':
        console.log('🔄 Session updated');
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🗣️ User speech detected');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🤐 User speech ended');
        break;

      case 'input_audio_buffer.committed':
        console.log('✅ Audio buffer committed');
        this.triggerResponse();
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          this.onTranscriptCallback?.(event.transcript, true);
        }
        break;

      case 'response.created':
        console.log('🤖 AI response started');
        break;

      case 'response.output_item.added':
        this.handleResponseItem(event);
        break;

      case 'response.audio.delta':
        if (event.delta) {
          this.handleAudioDelta(event.delta);
        }
        break;

      case 'response.audio.done':
        console.log('🔊 Audio response completed');
        break;

      case 'response.text.delta':
        if (event.delta) {
          this.onResponseCallback?.(event.delta);
        }
        break;

      case 'response.done':
        console.log('✅ AI response completed');
        break;

      case 'error':
        console.error('❌ Realtime API error:', event.error);
        this.onErrorCallback?.(event.error.message || 'Unknown error');
        break;

      default:
        console.log('🔍 Unhandled event:', event.type);
    }
  }

  // Handle response items (text, audio, etc.)
  private handleResponseItem(event: RealtimeEvent) {
    if (event.item?.content) {
      for (const content of event.item.content) {
        if (content.type === 'text' && content.text) {
          this.onResponseCallback?.(content.text);
        }
      }
    }
  }

  // Handle streaming audio deltas
  private handleAudioDelta(base64Audio: string) {
    try {
      const audioData = this.base64ToArrayBuffer(base64Audio);
      this.playAudioStream(audioData);
      this.onAudioCallback?.(audioData);
    } catch (error) {
      console.error('Failed to process audio delta:', error);
    }
  }

  // Play streaming audio with minimal latency
  private async playAudioStream(audioData: ArrayBuffer) {
    if (!this.audioContext) return;

    try {
      // Convert PCM16 to AudioBuffer
      const audioBuffer = await this.pcm16ToAudioBuffer(audioData);

      // Stop previous audio if playing
      if (this.currentAudioSource) {
        this.currentAudioSource.stop();
      }

      // Create and play new audio source
      this.currentAudioSource = this.audioContext.createBufferSource();
      this.currentAudioSource.buffer = audioBuffer;
      this.currentAudioSource.connect(this.audioContext.destination);
      this.currentAudioSource.start();

      this.isPlayingAudio = true;

      this.currentAudioSource.onended = () => {
        this.isPlayingAudio = false;
        this.currentAudioSource = null;
      };

    } catch (error) {
      console.error('Failed to play audio stream:', error);
    }
  }

  // Trigger AI response generation
  private triggerResponse() {
    const responseEvent = {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Please respond naturally as a health coach. Keep responses conversational and supportive.'
      }
    };

    this.sendEvent(responseEvent);
  }

  // Send event to Realtime API
  private sendEvent(event: RealtimeEvent) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send event - WebSocket not ready, state:', this.ws?.readyState);
      return;
    }

    const eventStr = JSON.stringify(event);
    console.log('📤 Sending event:', event.type, eventStr.substring(0, 300) + '...');
    this.ws.send(eventStr);
  }

  // Interrupt current AI response (for natural conversation)
  async interrupt() {
    if (!this.connected) return;

    // Stop current audio playback
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
      this.isPlayingAudio = false;
    }

    // Cancel current response
    const cancelEvent = {
      type: 'response.cancel'
    };

    this.sendEvent(cancelEvent);
    console.log('⏹️ AI response interrupted');
  }

  // Send text message (for hybrid text/voice interaction)
  async sendTextMessage(text: string) {
    if (!this.connected) return;

    const messageEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    this.sendEvent(messageEvent);
    this.triggerResponse();
  }

  // Audio conversion utilities
  private float32ToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return pcm16;
  }

  private async pcm16ToAudioBuffer(pcm16Data: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const int16Array = new Int16Array(pcm16Data);
    const audioBuffer = this.audioContext.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }

    return audioBuffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Handle binary audio data from WebSocket
  private async handleAudioData(blob: Blob) {
    try {
      // Convert blob to array buffer for audio processing
      const arrayBuffer = await blob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      console.log(`🎵 Processing ${audioData.length} bytes of audio data`);

      // For now, just log the audio data - in a full implementation,
      // you would decode and play the audio through Web Audio API
      // This prevents the JSON parsing error

    } catch (error) {
      console.error('❌ Error handling audio data:', error);
    }
  }

  // Cleanup and disconnect
  async disconnect() {
    console.log('🔌 Disconnecting from Realtime API...');

    this.connected = false;
    this.recording = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.cleanup();
  }

  private cleanup() {
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
    }

    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    this.isPlayingAudio = false;
    this.audioQueue = [];
    this.conversationItems = [];
  }

  // Status checks
  public isConnected(): boolean {
    return this.connected;
  }

  public isRecording(): boolean {
    return this.recording;
  }

  isSpeaking(): boolean {
    return this.isPlayingAudio;
  }

  // Get conversation history
  getConversationItems(): ConversationItem[] {
    return [...this.conversationItems];
  }
}

// Factory function to create configured health coaching service
export function createHealthCoachRealtimeService(apiKey: string): RealtimeVoiceService {
  const config: RealtimeConfig = {
    apiKey,
    model: 'gpt-4o-realtime-preview-2024-10-01',
    voice: 'nova', // Warm, caring voice for health coaching
    instructions: `You are Bearable AI, a compassionate health coaching companion powered by Mayo Clinic's lifestyle medicine expertise. You help users improve their health through evidence-based guidance focusing on the 6 pillars of lifestyle medicine:

1. **Nutrition** - Whole food, plant-rich diets
2. **Physical Activity** - Regular movement and exercise
3. **Sleep** - Quality rest and recovery
4. **Stress Management** - Mindfulness and coping strategies
5. **Social Connection** - Relationships and community
6. **Substance Avoidance** - Limiting harmful substances

## Your Personality & Approach:
- Warm, supportive, and encouraging (like a caring friend + medical expert)
- Use behavioral economics principles for sustainable change
- Provide specific, actionable advice with Mayo Clinic backing
- Always cite sources when giving medical/health information
- Celebrate small wins and progress
- Keep responses conversational and natural (2-4 sentences usually)
- Speak as if having a real conversation, not reading text

## Key Guidelines:
- ALWAYS emphasize you're for wellness support, not medical diagnosis/treatment
- Encourage users to consult healthcare providers for medical concerns
- Focus on lifestyle interventions and preventive health
- Use motivational interviewing techniques
- Be culturally sensitive and inclusive
- Adapt communication style to user preferences
- Respond naturally to interruptions and conversation flow

## Response Format:
- Lead with empathy and understanding
- Provide evidence-based guidance
- Include a clear, actionable next step
- End with encouragement or a relevant question
- Speak naturally as if in person, not like reading text

Remember: You're their health journey companion having a real conversation, not their doctor. Focus on sustainable lifestyle changes that align with Mayo Clinic's proven approaches to wellness.`,
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 1000
    },
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    input_audio_transcription: {
      model: 'whisper-1'
    }
  };

  return new RealtimeVoiceService(config);
}