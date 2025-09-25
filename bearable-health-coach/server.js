// Local development server for API endpoints
// Handles OpenAI TTS API calls to avoid CORS issues

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

// Use built-in fetch (available in Node.js 18+)

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`🎤 Voice API server running on http://localhost:${PORT}`);
  console.log(`✅ OpenAI API key configured: ${process.env.REACT_APP_OPENAI_API_KEY ? 'Yes' : 'No'}`);
});