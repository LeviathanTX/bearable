# Bearable Health Coach - Architecture Documentation

## Technology Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **Zustand** - State management

### Backend Services
- **Supabase** - Backend-as-a-Service (database, auth)
- **OpenAI** - AI conversation and analysis
- **ElevenLabs** - Premium voice synthesis
- **Node.js Server** - Custom voice API server

## Voice System Architecture

### Multi-Tier Voice Stack

#### Tier 1: Premium Voice (OpenAI TTS)
- **Port**: 3002
- **Server**: `server.js` (Node.js)
- **Features**: High-quality neural TTS
- **Fallback**: Local API endpoint if OpenAI unavailable

#### Tier 2: ElevenLabs Voice
- **Integration**: Direct API calls
- **Features**: Ultra-realistic voice cloning
- **Use Case**: Premium users, specific voice personas

#### Tier 3: Browser Voice (Fallback)
- **API**: Web Speech API (browser native)
- **Features**: Zero-latency, offline capable
- **Activation**: Automatic when premium services unavailable

### Port Configuration

```
React App:        Port 3001 (npm start)
Voice API Server: Port 3002 (node server.js)
```

### Voice Service Flow

```
User Input
    ↓
AI Processing (OpenAI)
    ↓
Text Response
    ↓
Voice Synthesis Decision:
    ├→ Premium Available? → OpenAI TTS (port 3002)
    ├→ ElevenLabs Enabled? → ElevenLabs API
    └→ Fallback → Browser Speech API
    ↓
Audio Output
```

## Project Structure

```
bearable-health-coach/
├── public/
│   ├── audio-processor.js   # Web Audio processing
│   └── index.html
├── src/
│   ├── components/
│   │   ├── VoiceMultiAgentChat.tsx  # Main voice interface
│   │   ├── VoiceSettings.tsx        # Voice config UI
│   │   ├── VoiceDebugger.tsx        # Voice diagnostics
│   │   ├── CoachBuilder/            # Coach customization
│   │   └── CoachDashboard/          # Coach management
│   ├── services/
│   │   ├── voiceService.ts          # Voice abstraction layer
│   │   ├── premiumVoiceService.ts   # OpenAI TTS integration
│   │   ├── elevenLabsVoiceService.ts # ElevenLabs integration
│   │   ├── cartesiaVoiceService.ts  # Cartesia integration
│   │   ├── speechRecognitionService.ts # Speech-to-text
│   │   ├── aiService.ts             # AI conversation logic
│   │   ├── coachService.ts          # Coach management
│   │   └── supabase.ts              # Supabase client
│   ├── stores/
│   │   └── multiAgentStore.ts       # Multi-agent state
│   └── types/
│       └── index.ts                 # TypeScript definitions
├── server.js                        # Voice API server (port 3002)
├── server-v2.js                    # Updated voice server
└── package.json
```

## Development Commands

### Start Development Environment

```bash
# Terminal 1: Start voice API server
node server.js
# or
PORT=3002 node server-v2.js

# Terminal 2: Start React app
npm start
# or for specific port
PORT=3001 npm start
```

### Testing & Verification

```bash
npm run verify      # Run all checks (lint, type-check, test)
npm test           # Run test suite
npm run lint:fix   # Auto-fix linting issues
npm run type-check # TypeScript compilation check
```

### Custom Commands (Claude CLI)

```bash
claude /test-loop   # Automated test fixing loop
claude /verify-pr   # Comprehensive PR verification
```

## Key Features

### Multi-Agent Health Coaching
- **Coach Teams**: Multiple AI coaches with specialized expertise
- **Coordinated Responses**: Agents collaborate on complex health questions
- **Personalized Coaching**: Adaptive guidance based on user profile

### Voice Interaction
- **Real-time Speech Recognition**: STT via browser API
- **Conversational AI**: Natural language understanding
- **Premium Voice Output**: Multiple TTS providers
- **Voice Debugging Tools**: Built-in diagnostics

### Coach Customization
- **Coach Builder**: Create custom health coaches
- **Template System**: Pre-built coach personas
- **Specialty Selection**: Nutrition, fitness, mental health, etc.
- **Voice Persona**: Assign unique voice characteristics

### Care Plans & Tracking
- **Goal Setting**: Define health objectives
- **Progress Monitoring**: Track metrics over time
- **Proactive Nudges**: Timely health reminders
- **Caregiver Dashboard**: Support for care teams

## Deployment

### Platform: Vercel / Railway

#### Environment Variables
```bash
REACT_APP_SUPABASE_URL=<supabase-url>
REACT_APP_SUPABASE_ANON_KEY=<supabase-key>
REACT_APP_OPENAI_API_KEY=<openai-key>
REACT_APP_ELEVENLABS_API_KEY=<elevenlabs-key>
```

#### Build Configuration
```bash
# Standard build
npm run build

# Skip preflight checks (if needed)
SKIP_PREFLIGHT_CHECK=true npm run build

# Disable TypeScript errors blocking build (use sparingly)
TSC_COMPILE_ON_ERROR=true npm run build

# Production build with CI flag
CI=false npm run build
```

## Voice System Debugging

### Common Voice Issues

**Voice not working**
1. Check browser console for errors
2. Verify microphone permissions granted
3. Test voice server is running (port 3002)
4. Check API keys are valid
5. Use VoiceDebugger component

**Audio cutting out**
1. Check network connection stability
2. Verify API rate limits not exceeded
3. Test with browser fallback voice
4. Check audio-processor.js loaded

**Recognition issues**
1. Verify microphone input levels
2. Check browser speech recognition support
3. Test in quiet environment
4. Try different voice input device

### Voice Testing

```bash
# Test voice server directly
curl http://localhost:3002/health

# Test OpenAI TTS endpoint
curl -X POST http://localhost:3002/api/voice/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'
```

## Performance Considerations

### Voice Latency Optimization
- Use streaming audio when available
- Preload common responses
- Implement audio buffering
- Cache frequently used phrases

### State Management
- Keep voice state separate from UI state
- Use Zustand for lightweight reactivity
- Debounce user input
- Implement request queuing

### Audio Processing
- Use Web Audio API for low latency
- Process audio in web workers
- Implement audio compression
- Monitor memory usage

## Security & Privacy

### Voice Data
- Never store raw audio without consent
- Implement proper data retention policies
- Use encrypted transmission
- Respect user privacy preferences

### API Keys
- Never expose keys in client code
- Use environment variables
- Implement rate limiting
- Rotate keys regularly

### Health Data (HIPAA Considerations)
- Follow HIPAA compliance guidelines
- Implement proper access controls
- Encrypt sensitive health data
- Maintain audit logs

## Troubleshooting

### Server Won't Start
- Check port 3002 is not in use: `lsof -i :3002`
- Kill existing process: `lsof -ti:3002 | xargs kill`
- Verify Node.js version compatibility
- Check for missing dependencies

### Build Failures
- Clear node_modules and reinstall
- Check for TypeScript errors: `npm run type-check`
- Verify all imports are correct
- Check for circular dependencies

### Supabase Connection Issues
- Verify environment variables are set
- Check Supabase project is active
- Test API key validity
- Review network/firewall settings

### Voice API Errors
- Check API key quotas/limits
- Verify API endpoint URLs
- Test with curl/Postman
- Review API provider status pages
