// Cartesia Voice Service - Ultra-low latency, high-quality voice synthesis
// Cartesia Sonic offers 90ms latency with superior voice quality

export interface CartesiaVoiceConfig {
  voice: string; // Cartesia voice ID
  speed: number; // 0.5 to 2.0
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'calm';
  stability?: number; // 0.0 to 1.0
  similarity?: number; // 0.0 to 1.0
}

export class CartesiaVoiceService {
  private apiKey: string;
  private baseUrl = 'https://api.cartesia.ai/v1';
  private websocketUrl = 'wss://api.cartesia.ai/v1/tts/websocket';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_CARTESIA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Cartesia API key not found. Voice synthesis will be limited.');
    }
  }

  // Ultra-low latency streaming voice synthesis
  async streamVoice(
    text: string,
    config: CartesiaVoiceConfig = { voice: 'a0e99841-438c-4a64-b679-ae26e5e21b35', speed: 1.0 }
  ): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('Cartesia API key required for voice synthesis');
    }

    try {
      const response = await fetch(`${this.baseUrl}/tts/bytes`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'sonic-english',
          transcript: text,
          voice: {
            mode: 'id',
            id: config.voice
          },
          output_format: {
            container: 'raw',
            encoding: 'pcm_f32le',
            sample_rate: 44100
          },
          language: 'en',
          speed: config.speed,
          ...(config.emotion && { emotion: config.emotion })
        })
      });

      if (!response.ok) {
        throw new Error(`Cartesia API error: ${response.status} ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('❌ Cartesia voice synthesis failed:', error);
      throw error;
    }
  }

  // Real-time WebSocket streaming for ultra-low latency
  createWebSocketStream(
    onAudioData: (audioData: ArrayBuffer) => void,
    onError: (error: string) => void,
    config: CartesiaVoiceConfig = { voice: 'a0e99841-438c-4a64-b679-ae26e5e21b35', speed: 1.0 }
  ): WebSocket {
    if (!this.apiKey) {
      onError('Cartesia API key required for WebSocket streaming');
      throw new Error('API key required');
    }

    const ws = new WebSocket(`${this.websocketUrl}?api_key=${this.apiKey}&cartesia_version=2024-06-10`);

    ws.onopen = () => {
      console.log('🎤 Cartesia WebSocket connected');

      // Send initial configuration
      ws.send(JSON.stringify({
        model_id: 'sonic-english',
        voice: {
          mode: 'id',
          id: config.voice
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: 44100
        },
        language: 'en',
        speed: config.speed
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'audio' && data.data) {
          // Convert base64 to ArrayBuffer
          const audioData = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
          onAudioData(audioData.buffer);
        } else if (data.type === 'error') {
          onError(data.error || 'Unknown Cartesia error');
        }
      } catch (error) {
        console.error('❌ WebSocket message parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Cartesia WebSocket error:', error);
      onError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('🔌 Cartesia WebSocket disconnected');
    };

    return ws;
  }

  // Send text for real-time synthesis
  sendTextToStream(ws: WebSocket, text: string, contextId?: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        context_id: contextId || `context_${Date.now()}`,
        model_id: 'sonic-english',
        transcript: text
      }));
    } else {
      console.warn('⚠️ WebSocket not ready for sending text');
    }
  }

  // Get available Cartesia voices
  async getAvailableVoices(): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('⚠️ API key required to fetch Cartesia voices');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'X-API-Key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const voices = await response.json();
      console.log(`🎙️ Loaded ${voices.length} Cartesia voices`);
      return voices;
    } catch (error) {
      console.error('❌ Failed to fetch Cartesia voices:', error);
      return [];
    }
  }

  // Default high-quality voices for health coaching
  static getHealthCoachingVoices() {
    return [
      {
        id: 'a0e99841-438c-4a64-b679-ae26e5e21b35',
        name: 'British Lady',
        description: 'Warm, professional British accent - perfect for health guidance',
        gender: 'female',
        accent: 'british'
      },
      {
        id: '95856005-0332-41b0-935f-352e296aa0df',
        name: 'American Female',
        description: 'Clear, empathetic American voice - ideal for supportive coaching',
        gender: 'female',
        accent: 'american'
      },
      {
        id: '87748186-23bb-4158-a1eb-332911b0401d',
        name: 'Calm Narrator',
        description: 'Soothing, neutral voice - excellent for relaxation and wellness',
        gender: 'neutral',
        accent: 'neutral'
      }
    ];
  }

  // Test voice quality
  async testVoice(voiceId: string, testPhrase?: string): Promise<ArrayBuffer> {
    const phrase = testPhrase || "Hello! I'm your Bearable AI health companion. I'm here to support you on your wellness journey with gentle guidance and encouragement.";

    return this.streamVoice(phrase, {
      voice: voiceId,
      speed: 1.0,
      emotion: 'calm'
    });
  }

  // Play audio from ArrayBuffer
  async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBufferSource = audioContext.createBufferSource();

      // Convert PCM float32 to AudioBuffer
      const audioData = await audioContext.decodeAudioData(audioBuffer);
      audioBufferSource.buffer = audioData;
      audioBufferSource.connect(audioContext.destination);
      audioBufferSource.start();

      console.log('🔊 Playing Cartesia audio');
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      throw error;
    }
  }
}

export default CartesiaVoiceService;