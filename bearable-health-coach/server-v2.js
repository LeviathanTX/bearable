// Production-grade WebSocket proxy server for OpenAI Realtime API
// Fixes critical issues: race conditions, connection stability, error handling

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Create HTTP server
const server = http.createServer(app);

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://bearable-health-coach.vercel.app', 'https://bearable-health-coach-*.vercel.app']
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use('/api/', apiLimiter);

// Connection state management
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed'
};

// Voice Activity Detection for natural conversation flow
class VoiceActivityDetector {
  constructor() {
    this.silenceThreshold = 1500; // 1.5 seconds of silence to trigger response
    this.minSpeechDuration = 300; // Minimum 300ms of speech to be considered valid
    this.isActive = false;
    this.speechStartTime = null;
    this.lastActivityTime = null;
    this.silenceTimer = null;
  }

  detectVoiceActivity(audioLevel, timestamp) {
    const currentTime = timestamp || Date.now();
    const isSpeaking = audioLevel > 0.1; // Threshold for voice detection

    if (isSpeaking) {
      if (!this.isActive) {
        // Speech started
        this.isActive = true;
        this.speechStartTime = currentTime;
        console.log('🎤 Voice activity detected - speech started');
      }
      this.lastActivityTime = currentTime;

      // Clear any pending silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    } else if (this.isActive) {
      // Potential silence detected, start timer if not already started
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          this.onSilenceDetected();
        }, this.silenceThreshold);
      }
    }

    return {
      isActive: this.isActive,
      speechDuration: this.isActive ? currentTime - this.speechStartTime : 0,
      silenceDuration: this.lastActivityTime ? currentTime - this.lastActivityTime : 0
    };
  }

  onSilenceDetected() {
    if (this.isActive) {
      const speechDuration = Date.now() - this.speechStartTime;

      if (speechDuration >= this.minSpeechDuration) {
        console.log(`🔇 End of speech detected (${speechDuration}ms duration)`);
        this.isActive = false;
        this.speechStartTime = null;
        this.lastActivityTime = null;
        this.silenceTimer = null;

        // Return true to indicate speech has ended
        return true;
      } else {
        console.log('🔇 Silence detected but speech too short, continuing...');
        this.isActive = false;
        this.speechStartTime = null;
      }
    }

    this.silenceTimer = null;
    return false;
  }

  reset() {
    this.isActive = false;
    this.speechStartTime = null;
    this.lastActivityTime = null;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  forceEndSpeech() {
    const wasActive = this.isActive;
    this.reset();
    return wasActive;
  }
}

// Multi-agent conversation orchestrator for health specialists
class HealthConversationOrchestrator {
  constructor() {
    this.activeAgents = new Map(); // agentId -> agent config
    this.conversationHistory = [];
    this.currentSpeaker = null;
    this.facilitatorMode = false;

    // Default health specialist voices
    this.healthVoices = {
      'dr-maya-wellness': { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Dr. Maya' },
      'coach-alex-fitness': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Coach Alex' },
      'nutritionist-sarah': { voiceId: 'jsCqWAovK2LkecY7zXl4', name: 'Sarah' },
      'therapist-david': { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Dr. David' },
      'sleep-specialist-lisa': { voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Dr. Lisa' },
      'facilitator-dr-chen': { voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Dr. Chen' }
    };
  }

  async processUserInput(text, selectedAgents = []) {
    console.log(`🗣️ Processing user input: "${text}" with agents: ${selectedAgents.join(', ')}`);

    // Simple routing logic (in production this would be more sophisticated)
    const responses = [];

    if (selectedAgents.length === 0) {
      // Default to primary care if no agents selected
      selectedAgents = ['dr-maya-wellness'];
    }

    for (const agentId of selectedAgents) {
      if (this.healthVoices[agentId]) {
        const response = await this.generateAgentResponse(agentId, text);
        responses.push({
          agentId,
          text: response,
          voiceConfig: this.healthVoices[agentId]
        });
      }
    }

    return responses;
  }

  async generateAgentResponse(agentId, userInput) {
    // Placeholder for AI response generation
    // In production, this would call your multi-agent AI service
    const agentPersonalities = {
      'dr-maya-wellness': 'As a primary care physician, I focus on your overall health and preventive care.',
      'coach-alex-fitness': 'As your fitness coach, I\'m here to help you achieve your movement and exercise goals!',
      'nutritionist-sarah': 'As a registered dietitian, I can help you with evidence-based nutrition guidance.',
      'therapist-david': 'As a psychologist, I\'m here to support your mental health and emotional wellbeing.',
      'sleep-specialist-lisa': 'As a sleep specialist, I can help you optimize your sleep for better health.',
      'facilitator-dr-chen': 'I help coordinate our team to ensure you get comprehensive care.'
    };

    const personality = agentPersonalities[agentId] || 'I\'m here to help with your health questions.';

    // Simple response (in production, integrate with your AI service)
    return `${personality} Regarding "${userInput}", I recommend we discuss this further to provide you with the best guidance.`;
  }

  async generateSpeechForAgent(agentId, text) {
    const voiceConfig = this.healthVoices[agentId];
    if (!voiceConfig) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    console.log(`🎙️ Generating speech for ${voiceConfig.name}: "${text.substring(0, 50)}..."`);

    try {
      // Call our ElevenLabs TTS endpoint
      const response = await fetch('http://localhost:3004/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: voiceConfig.voiceId,
          settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error(`❌ Speech generation failed for ${agentId}:`, error);
      throw error;
    }
  }
}

// WebSocket connection manager with proper error handling
class RealtimeConnectionManager {
  constructor(clientWs, apiKey) {
    this.clientWs = clientWs;
    this.apiKey = apiKey;
    this.openaiWs = null;
    this.state = ConnectionState.DISCONNECTED;
    this.messageQueue = [];
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.lastPingTime = null;
    this.connectionTimeout = null;

    // Rate limiting per connection
    this.messageCount = 0;
    this.messageResetTime = Date.now();
    this.maxMessagesPerMinute = 60;

    // Add conversation orchestrator
    this.conversationOrchestrator = new HealthConversationOrchestrator();
    this.isConversationMode = false;
    this.selectedAgents = [];

    // Voice Activity Detection
    this.voiceActivityDetector = new VoiceActivityDetector();
    this.isListening = false;
    this.currentTranscript = '';
    this.vadTimeout = null;

    this.setupClientHandlers();
    this.connect();
  }

  async connect() {
    if (this.state === ConnectionState.CONNECTING || this.state === ConnectionState.CONNECTED) {
      return;
    }

    this.state = ConnectionState.CONNECTING;
    this.notifyClient('connecting');

    try {
      console.log('🌐 Connecting to OpenAI Realtime API...');

      this.openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        },
        handshakeTimeout: 10000 // 10 second timeout
      });

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.state === ConnectionState.CONNECTING) {
          console.error('❌ OpenAI connection timeout');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, 15000);

      this.setupOpenAIHandlers();

    } catch (error) {
      console.error('❌ Failed to create OpenAI WebSocket:', error);
      this.handleConnectionError(error);
    }
  }

  setupOpenAIHandlers() {
    this.openaiWs.on('open', () => {
      console.log('✅ Connected to OpenAI Realtime API');

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyClient('connected');

      this.startHeartbeat();
      this.flushMessageQueue();
    });

    this.openaiWs.on('message', (data) => {
      if (this.clientWs.readyState === WebSocket.OPEN) {
        this.clientWs.send(data);
      }
    });

    this.openaiWs.on('close', (code, reason) => {
      console.log(`🔌 OpenAI Realtime API disconnected: ${code} ${reason}`);
      this.stopHeartbeat();

      const errorMessage = this.getErrorMessage(code, reason);
      console.log(`📋 Error details: ${errorMessage}`);

      this.state = ConnectionState.DISCONNECTED;
      this.notifyClient('disconnected', errorMessage);

      // Attempt reconnection for recoverable errors
      if (this.isRecoverableError(code)) {
        this.scheduleReconnect();
      } else {
        this.state = ConnectionState.FAILED;
        this.notifyClient('error', errorMessage);
        this.closeClientConnection(code, errorMessage);
      }
    });

    this.openaiWs.on('error', (error) => {
      console.error('❌ OpenAI Realtime API error:', error);
      this.handleConnectionError(error);
    });

    this.openaiWs.on('pong', () => {
      console.log('🏓 Received pong from OpenAI');
      this.lastPingTime = Date.now();
    });
  }

  setupClientHandlers() {
    this.clientWs.on('message', (data) => {
      this.handleClientMessage(data);
    });

    this.clientWs.on('close', (code, reason) => {
      console.log(`🔌 Client disconnected: ${code} ${reason}`);
      this.cleanup();
    });

    this.clientWs.on('error', (error) => {
      console.error('❌ Client WebSocket error:', error);
      this.cleanup();
    });
  }

  async handleClientMessage(data) {
    // Rate limiting
    if (!this.checkRateLimit()) {
      console.warn('⚠️ Rate limit exceeded for client');
      return;
    }

    try {
      // Parse client message
      const message = JSON.parse(data.toString());
      console.log(`📨 Client message type: ${message.type}`);

      // Handle conversation-specific messages first (before OpenAI processing)
      if (message.type && message.type.startsWith('conversation.')) {
        await this.handleConversationMessage(message);
        return;
      }

      // Handle voice activity and speech messages
      if (message.type && (message.type.startsWith('voice.') || message.type.startsWith('speech.'))) {
        await this.handleVoiceMessage(message);
        return;
      }

      // Handle OpenAI Realtime API messages
      if (this.state === ConnectionState.CONNECTED &&
          this.openaiWs &&
          this.openaiWs.readyState === WebSocket.OPEN) {

        // Intercept conversation.item.create for audio transcript processing
        if (message.type === 'conversation.item.create' &&
            message.item?.type === 'message' &&
            message.item?.role === 'user' &&
            this.isConversationMode) {

          const transcript = message.item.content?.[0]?.transcript;
          if (transcript) {
            console.log(`🎤 Transcript received: "${transcript}"`);
            await this.processConversationInput(transcript);
            return;
          }
        }

        this.openaiWs.send(data);
        console.log('📤 Message forwarded to OpenAI');
      } else {
        this.queueMessage(data);
      }

    } catch (error) {
      console.error('❌ Error handling client message:', error);

      // If it's not JSON, treat as raw data and forward to OpenAI
      if (this.state === ConnectionState.CONNECTED &&
          this.openaiWs &&
          this.openaiWs.readyState === WebSocket.OPEN) {
        this.openaiWs.send(data);
        console.log('📤 Raw message forwarded to OpenAI');
      } else {
        this.queueMessage(data);
      }
    }
  }

  async handleConversationMessage(message) {
    switch (message.type) {
      case 'conversation.configure':
        this.isConversationMode = true;
        this.selectedAgents = message.agents || ['dr-maya-wellness'];
        console.log(`🩺 Conversation mode enabled with agents: ${this.selectedAgents.join(', ')}`);

        this.notifyClient('conversation_configured', {
          agents: this.selectedAgents,
          message: 'Conversation mode active'
        });
        break;

      case 'conversation.input':
        if (this.isConversationMode) {
          await this.processConversationInput(message.text);
        }
        break;

      default:
        console.warn(`⚠️ Unknown conversation message type: ${message.type}`);
    }
  }

  async handleVoiceMessage(message) {
    if (!this.isConversationMode) {
      console.warn('⚠️ Voice message received but not in conversation mode');
      return;
    }

    switch (message.type) {
      case 'voice.activity':
        const vadResult = this.voiceActivityDetector.detectVoiceActivity(
          message.audioLevel || 0,
          message.timestamp
        );

        // Send VAD status to client
        this.notifyClient('voice_activity', vadResult);

        // If silence is detected and speech ended, process any accumulated transcript
        if (!vadResult.isActive && this.currentTranscript.trim()) {
          console.log(`🎤 Processing accumulated transcript: "${this.currentTranscript}"`);
          await this.processConversationInput(this.currentTranscript);
          this.currentTranscript = '';
        }
        break;

      case 'speech.partial':
        this.currentTranscript = message.transcript || '';
        console.log(`🎤 Partial transcript: "${this.currentTranscript}"`);

        // Reset VAD timeout when new speech comes in
        if (this.vadTimeout) {
          clearTimeout(this.vadTimeout);
        }

        // Set timeout to process transcript if no more speech comes
        this.vadTimeout = setTimeout(() => {
          if (this.currentTranscript.trim()) {
            console.log(`⏰ VAD timeout - processing transcript: "${this.currentTranscript}"`);
            this.processConversationInput(this.currentTranscript);
            this.currentTranscript = '';
          }
        }, 2000); // 2 second timeout
        break;

      default:
        console.warn(`⚠️ Unknown voice message type: ${message.type}`);
    }
  }


  async processConversationInput(text) {
    try {
      console.log(`🔄 Processing conversation input: "${text}"`);

      // Get responses from selected health specialists
      const responses = await this.conversationOrchestrator.processUserInput(text, this.selectedAgents);

      // Send responses back to client with voice
      for (const response of responses) {
        console.log(`🗣️ ${response.voiceConfig.name}: "${response.text}"`);

        // Notify client of text response
        this.notifyClient('conversation_response', {
          agentId: response.agentId,
          agentName: response.voiceConfig.name,
          text: response.text
        });

        try {
          // Generate speech
          const audioBuffer = await this.conversationOrchestrator.generateSpeechForAgent(
            response.agentId,
            response.text
          );

          // Send audio to client
          this.sendAudioToClient(response.agentId, response.voiceConfig.name, audioBuffer);

        } catch (audioError) {
          console.error(`❌ Audio generation failed for ${response.agentId}:`, audioError);
          // Continue with text-only response
        }
      }

    } catch (error) {
      console.error('❌ Error processing conversation input:', error);
      this.notifyClient('error', { message: 'Failed to process conversation input' });
    }
  }

  sendAudioToClient(agentId, agentName, audioBuffer) {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      const audioMessage = JSON.stringify({
        type: 'conversation_audio',
        agentId: agentId,
        agentName: agentName,
        audioData: Buffer.from(audioBuffer).toString('base64'),
        timestamp: new Date().toISOString()
      });

      this.clientWs.send(audioMessage);
      console.log(`🔊 Sent audio for ${agentName} (${audioBuffer.byteLength} bytes)`);
    }
  }

  queueMessage(data) {
    // Prevent queue overflow
    if (this.messageQueue.length >= 50) {
      console.warn('⚠️ Message queue full, dropping oldest message');
      this.messageQueue.shift();
    }

    this.messageQueue.push(data);
    console.log(`📝 Message queued (${this.messageQueue.length} in queue)`);
  }

  flushMessageQueue() {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Sending ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0 &&
           this.openaiWs &&
           this.openaiWs.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.openaiWs.send(message);
    }
  }

  checkRateLimit() {
    const now = Date.now();
    if (now - this.messageResetTime > 60000) {
      this.messageCount = 0;
      this.messageResetTime = now;
    }

    this.messageCount++;
    return this.messageCount <= this.maxMessagesPerMinute;
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
        console.log('🏓 Sending ping to OpenAI');
        this.openaiWs.ping();

        // Check if we received pong from last ping
        if (this.lastPingTime && (Date.now() - this.lastPingTime) > 60000) {
          console.warn('⚠️ No pong received, connection may be stale');
          this.handleConnectionError(new Error('Heartbeat timeout'));
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.state = ConnectionState.FAILED;
      this.notifyClient('error', 'Unable to reconnect to OpenAI after multiple attempts');
      return;
    }

    this.reconnectAttempts++;
    this.state = ConnectionState.RECONNECTING;
    this.notifyClient('reconnecting');

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.reconnectDelay}ms`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }

  isRecoverableError(code) {
    // Recoverable error codes
    const recoverableCodes = [1000, 1001, 1005, 1006, 1011];
    return recoverableCodes.includes(code);
  }

  getErrorMessage(code, reason) {
    const reasonStr = reason ? reason.toString() : '';

    if (code === 1002 || code === 1003) {
      return 'OpenAI API quota exceeded or payment required. Please check your OpenAI account billing.';
    } else if (code === 1008) {
      return 'OpenAI API policy violation. Please check your API usage.';
    } else if (code === 1011) {
      return 'OpenAI API server error. Please try again later.';
    } else if (reasonStr.toLowerCase().includes('insufficient')) {
      return 'OpenAI API quota exceeded. Please check your account billing.';
    } else if (code === 1000) {
      return 'Connection closed normally';
    } else if (code === 1001) {
      return 'Connection closed by endpoint';
    } else if (code === 1005) {
      return 'No status code received';
    } else if (code === 1006) {
      return 'Connection closed abnormally';
    } else {
      return `OpenAI connection closed with code ${code}: ${reasonStr}`;
    }
  }

  handleConnectionError(error) {
    console.error('❌ Connection error:', error);
    this.stopHeartbeat();

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.state = ConnectionState.DISCONNECTED;
    this.notifyClient('error', error.message);
    this.scheduleReconnect();
  }

  notifyClient(status, message = '') {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      const statusMessage = JSON.stringify({
        type: 'status',
        status: status,
        message: message,
        timestamp: new Date().toISOString()
      });
      this.clientWs.send(statusMessage);
    }
  }

  closeClientConnection(code = 1000, reason = '') {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.close(code, reason);
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up connection manager');

    this.stopHeartbeat();

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
      this.openaiWs.close();
    }

    this.messageQueue = [];
    this.state = ConnectionState.DISCONNECTED;
  }
}

// Create WebSocket server for Realtime API proxy
const wss = new WebSocket.Server({ server, path: '/realtime' });

// Track active connections for monitoring
const activeConnections = new Map();

wss.on('connection', (ws, req) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`🔗 Client connected from ${clientIP}`);

  // Check connection limit per IP
  const connectionsFromIP = Array.from(activeConnections.values())
    .filter(conn => conn.clientIP === clientIP).length;

  // Allow more connections in development for testing
  const maxConnections = process.env.NODE_ENV === 'production' ? 3 : 10;
  if (connectionsFromIP >= maxConnections) {
    console.warn(`⚠️ Too many connections from ${clientIP} (${connectionsFromIP}/${maxConnections})`);
    ws.close(1008, 'Too many connections from this IP');
    return;
  }

  // Get OpenAI API key (server-side only for security)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OpenAI API key not found');
    ws.close(1008, 'API key not configured');
    return;
  }

  // Create connection manager
  const connectionId = Math.random().toString(36).substring(7);
  const manager = new RealtimeConnectionManager(ws, apiKey);

  activeConnections.set(connectionId, {
    manager: manager,
    clientIP: clientIP,
    connectedAt: new Date()
  });

  ws.on('close', () => {
    console.log(`🔌 Cleaning up connection ${connectionId}`);
    activeConnections.delete(connectionId);
  });
});

// ElevenLabs TTS endpoint for enhanced voice synthesis
app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, voiceId, settings } = req.body;

    // Enhanced input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Valid text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    // Get ElevenLabs API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('❌ ElevenLabs API key not found for TTS');
      return res.status(500).json({ error: 'ElevenLabs voice service not configured' });
    }

    console.log(`🎙️ Generating ElevenLabs voice: "${text.substring(0, 50)}..." with voice ${voiceId}`);

    // Call ElevenLabs TTS API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: settings?.stability ?? 0.5,
          similarity_boost: settings?.similarity_boost ?? 0.75,
          style: settings?.style ?? 0.2,
          use_speaker_boost: settings?.use_speaker_boost ?? false
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs TTS API error:', response.status, errorText);

      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      } else if (response.status === 401) {
        return res.status(500).json({ error: 'Authentication error with ElevenLabs voice service' });
      } else {
        return res.status(500).json({ error: 'ElevenLabs voice generation failed' });
      }
    }

    console.log(`✅ ElevenLabs voice generated successfully (${voiceId})`);

    // Get the audio buffer and stream response with proper headers
    const audioBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Voice-Service', 'elevenlabs');
    res.setHeader('X-Voice-ID', voiceId);
    res.setHeader('X-Generated-At', new Date().toISOString());
    res.setHeader('Content-Length', audioBuffer.byteLength);

    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('❌ ElevenLabs voice generation error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Voice generation timeout' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// ElevenLabs voices list endpoint
app.get('/api/voice/voices', async (req, res) => {
  try {
    // Get ElevenLabs API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('❌ ElevenLabs API key not found for voices');
      return res.status(500).json({ error: 'ElevenLabs voice service not configured' });
    }

    console.log('🎤 Fetching available ElevenLabs voices...');

    // Call ElevenLabs voices API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs voices API error:', response.status, errorText);

      if (response.status === 401) {
        return res.status(500).json({ error: 'Authentication error with ElevenLabs voice service' });
      } else {
        return res.status(500).json({ error: 'Failed to fetch voices from ElevenLabs' });
      }
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.voices?.length || 0} ElevenLabs voices`);

    res.json(data);

  } catch (error) {
    console.error('❌ ElevenLabs voices fetch error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Voices fetch timeout' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced voice generation endpoint with better error handling
app.post('/api/voice/generate', async (req, res) => {
  try {
    const { text, voice, speed = 1.0, model = 'tts-1-hd', response_format = 'mp3' } = req.body;

    // Enhanced input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Valid text is required' });
    }

    if (text.length > 4096) {
      return res.status(400).json({ error: 'Text too long (max 4096 characters)' });
    }

    // Validate voice parameter
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (voice && !validVoices.includes(voice)) {
      return res.status(400).json({ error: 'Invalid voice selection' });
    }

    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OpenAI API key not found for TTS');
      return res.status(500).json({ error: 'Voice service configuration error' });
    }

    console.log(`🎙️ Generating voice: "${text.substring(0, 50)}..." with ${voice || 'default'} voice`);

    // Call OpenAI TTS API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice: voice || 'alloy',
        speed: Math.max(0.25, Math.min(4.0, speed)),
        response_format
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI TTS API error:', response.status, errorText);

      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      } else if (response.status === 401) {
        return res.status(500).json({ error: 'Authentication error with voice service' });
      } else {
        return res.status(500).json({ error: 'Voice generation failed' });
      }
    }

    console.log(`✅ Voice generated successfully (${voice || 'alloy'}, speed: ${speed})`);

    // Stream response with proper headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Voice-Model', model);
    res.setHeader('X-Voice-Character', voice || 'alloy');
    res.setHeader('X-Generated-At', new Date().toISOString());

    response.body.pipe(res);

  } catch (error) {
    console.error('❌ Voice generation error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Voice generation timeout' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    message: 'Voice API server running',
    timestamp: new Date().toISOString(),
    connections: {
      active: activeConnections.size,
      total: wss.clients.size
    },
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(health);
});

// Connection monitoring endpoint
app.get('/api/status', (req, res) => {
  const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
    id: id,
    clientIP: conn.clientIP,
    connectedAt: conn.connectedAt,
    state: conn.manager.state,
    queueLength: conn.manager.messageQueue.length
  }));

  res.json({
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: connections
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');

  activeConnections.forEach((conn, id) => {
    conn.manager.cleanup();
  });

  server.close(() => {
    console.log('👋 Server stopped');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🎤 Enhanced Voice API server running on port ${PORT}`);
  console.log(`🔗 Realtime API proxy available at ws://localhost:${PORT}/realtime`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ OpenAI API key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});