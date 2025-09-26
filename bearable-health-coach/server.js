// Local development server for API endpoints
// Handles OpenAI TTS API calls and Realtime API WebSocket proxy

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config(); // Load environment variables from .env

// Use built-in fetch (available in Node.js 18+)

const app = express();
const PORT = 3002;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Create WebSocket server for Realtime API proxy
const wss = new WebSocket.Server({ server, path: '/realtime' });

// WebSocket proxy for OpenAI Realtime API
wss.on('connection', (ws) => {
  console.log('🔗 Client connected to Realtime API proxy');

  // Get OpenAI API key
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OpenAI API key not found for Realtime API');
    ws.close(1000, 'API key not configured');
    return;
  }

  // Message queue for messages received before OpenAI connection is ready
  let messageQueue = [];
  let openaiConnected = false;

  // Connect to OpenAI Realtime API
  const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  console.log('🌐 Connecting to OpenAI Realtime API...');

  // OpenAI WebSocket event handlers
  openaiWs.on('open', () => {
    console.log('✅ Connected to OpenAI Realtime API');
    openaiConnected = true;

    // Send any queued messages
    if (messageQueue.length > 0) {
      console.log(`📤 Sending ${messageQueue.length} queued messages`);
      messageQueue.forEach(message => {
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(message);
        }
      });
      messageQueue = [];
    }
  });

  openaiWs.on('message', (data) => {
    // Forward OpenAI messages to client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  openaiWs.on('close', (code, reason) => {
    console.log(`🔌 OpenAI Realtime API disconnected: ${code} ${reason}`);

    // Check for common payment/quota issues
    let errorMessage = 'OpenAI connection closed';
    if (code === 1002 || code === 1003) {
      errorMessage = 'OpenAI API quota exceeded or payment required. Please check your OpenAI account billing.';
      console.error('💳 OpenAI API payment/quota issue detected');
    } else if (code === 1008) {
      errorMessage = 'OpenAI API policy violation. Please check your API usage.';
    } else if (code === 1011) {
      errorMessage = 'OpenAI API server error. Please try again later.';
    } else if (reason && reason.toString().toLowerCase().includes('insufficient')) {
      errorMessage = 'OpenAI API quota exceeded. Please check your account billing.';
      console.error('💳 OpenAI API quota exceeded detected from reason');
    }

    openaiConnected = false;
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(code, errorMessage);
    }
  });

  openaiWs.on('error', (error) => {
    console.error('❌ OpenAI Realtime API error:', error);

    // Check for payment/quota related errors
    const errorStr = error.toString().toLowerCase();
    let errorMessage = 'OpenAI connection error';

    if (errorStr.includes('insufficient') || errorStr.includes('quota') || errorStr.includes('billing')) {
      errorMessage = 'OpenAI API quota exceeded or payment required. Please check your OpenAI account billing.';
      console.error('💳 OpenAI API payment/quota issue detected in error');
    } else if (errorStr.includes('unauthorized') || errorStr.includes('invalid')) {
      errorMessage = 'OpenAI API key invalid or unauthorized. Please check your API key.';
    }

    openaiConnected = false;
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, errorMessage);
    }
  });

  // Client WebSocket event handlers
  ws.on('message', (data) => {
    // Forward client messages to OpenAI, or queue if not ready
    if (openaiConnected && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(data);
    } else {
      // Queue message for when connection is ready
      messageQueue.push(data);
      console.log(`📥 Queued message (${messageQueue.length} in queue)`);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`🔌 Client disconnected from Realtime proxy: ${code} ${reason}`);
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Client WebSocket error:', error);
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });
});

// Voice generation endpoint
app.post('/api/voice/generate', async (req, res) => {
  try {
    const { text, voice, speed = 1.0, model = 'tts-1-hd', response_format = 'mp3' } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 4096) {
      return res.status(400).json({ error: 'Text too long (max 4096 characters)' });
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found');
      return res.status(500).json({ error: 'Voice service configuration error' });
    }

    console.log(`🎙️ Generating voice for: "${text.substring(0, 50)}..." with voice: ${voice}`);

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        speed: Math.max(0.25, Math.min(4.0, speed)), // Clamp speed to valid range
        response_format
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS API error:', error);
      return res.status(response.status).json({ error: 'Voice generation failed' });
    }

    console.log(`✅ Voice generated successfully (${voice}, speed: ${speed})`);

    // Stream the audio response back to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Voice-Model', model);
    res.setHeader('X-Voice-Character', voice);

    response.body.pipe(res);

  } catch (error) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Voice API server running' });
});

server.listen(PORT, () => {
  console.log(`🎤 Voice API server running on http://localhost:${PORT}`);
  console.log(`🔗 Realtime API proxy available at ws://localhost:${PORT}/realtime`);
  console.log(`✅ OpenAI API key configured: ${process.env.REACT_APP_OPENAI_API_KEY ? 'Yes' : 'No'}`);
});