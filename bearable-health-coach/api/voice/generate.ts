// Vercel Edge Function for OpenAI TTS Generation
// Provides premium voice synthesis with global edge distribution

export const runtime = 'edge';

interface VoiceRequest {
  text: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
  model?: 'tts-1' | 'tts-1-hd';
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

export default async function handler(request: Request) {
  // CORS headers for client-side requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { text, voice, speed = 1.0, model = 'tts-1-hd', response_format = 'mp3' }: VoiceRequest = await request.json();

    // Validate input
    if (!text || text.trim().length === 0) {
      return new Response('Text is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    if (text.length > 4096) {
      return new Response('Text too long (max 4096 characters)', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found');
      return new Response('Voice service configuration error', {
        status: 500,
        headers: corsHeaders
      });
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
      return new Response('Voice generation failed', {
        status: response.status,
        headers: corsHeaders
      });
    }

    // Stream the audio response back to client
    const audioStream = response.body;

    if (!audioStream) {
      return new Response('No audio stream received', {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log(`✅ Voice generated successfully (${voice}, speed: ${speed})`);

    // Return audio stream with proper headers
    return new Response(audioStream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Voice-Model': model,
        'X-Voice-Character': voice,
      },
    });

  } catch (error) {
    console.error('Voice generation error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
}