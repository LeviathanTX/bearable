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

  handleClientMessage(data) {
    // Rate limiting
    if (!this.checkRateLimit()) {
      console.warn('⚠️ Rate limit exceeded for client');
      return;
    }

    if (this.state === ConnectionState.CONNECTED &&
        this.openaiWs &&
        this.openaiWs.readyState === WebSocket.OPEN) {

      this.openaiWs.send(data);
      console.log('📤 Message forwarded to OpenAI');
    } else {
      this.queueMessage(data);
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

  if (connectionsFromIP >= 3) {
    console.warn(`⚠️ Too many connections from ${clientIP}`);
    ws.close(1008, 'Too many connections from this IP');
    return;
  }

  // Get OpenAI API key (server-side only for security)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OpenAI API key not found in server environment');
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

    // Get OpenAI API key (server-side only for security)
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
  console.log(`✅ OpenAI API key configured: ${process.env.REACT_APP_OPENAI_API_KEY ? 'Yes' : 'No'}`);
});