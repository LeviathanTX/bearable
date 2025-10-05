# Bearable AI Health Coach - Setup Instructions

## Overview

This is the **Mayo Bearable AI MVP** - a voice-first AI health coaching platform integrating Mayo Clinic Lifestyle Medicine with personal AI companionship.

## Architecture Highlights

- **Personal Bearable AI**: Single evolving AI companion dedicated to each user
- **6 Specialist Agents**: Nutrition, Physical Activity, Sleep, Stress Management, Social Connection, Substance Avoidance
- **Multi-Agent Orchestration**: LangChain-powered coordination between Personal AI and specialists
- **Persistent Memory**: Supabase + pgvector for conversation history and learning
- **Voice-First**: ElevenLabs Conversational AI for natural dialogue
- **Behavioral Economics**: ML-powered nudge engine for healthy habit formation

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works for MVP)
- OpenAI API key
- ElevenLabs API key (already configured)

## Step 1: Clone and Install

```bash
cd /Users/jeffl/projects/bearable
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "bearable-health-coach"
4. Choose a database password (save it securely)
5. Select a region close to your users
6. Wait for project to be ready (~2 minutes)

### 2.2 Deploy Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this repo
4. Paste into the SQL editor
5. Click "Run" (bottom right)
6. Verify success - you should see "Success. No rows returned"

### 2.3 Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys")

## Step 3: Configure Environment Variables

Edit `.env.local` and add your credentials:

```bash
# Supabase (Database & Authentication)
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (AI Orchestration & Embeddings)
REACT_APP_OPENAI_API_KEY=sk-your-openai-key-here

# Already configured:
# - REACT_APP_ELEVENLABS_API_KEY
# - REACT_APP_SENTRY_DSN
```

## Step 4: Verify Setup

Run the verification script:

```bash
npm run verify
```

This will check:
- All dependencies installed ✓
- Environment variables configured ✓
- TypeScript compilation ✓
- Tests pass ✓

## Step 5: Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Architecture Components

### State Management (Zustand)

```typescript
// User state (profile, preferences, health data)
src/stores/userStore.ts

// Conversation state (messages, context, memory)
src/stores/conversationStore.ts

// Agent state (6 specialists, consultations)
src/stores/agentStore.ts
```

### AI Orchestration (LangChain)

```typescript
// Main orchestrator - coordinates Personal AI + specialists
src/services/aiOrchestrator.ts
```

### Database Client (Supabase)

```typescript
// Supabase client + TypeScript types
src/lib/supabase.ts
```

### Consent Management (HIPAA-Compliant)

```typescript
// Consent types and interfaces
src/types/consent.ts

// Consent enforcement service
src/services/consentService.ts

// User-facing consent UI
src/components/ConsentManagement/
```

## Testing the Multi-Agent System

### Example Conversation Flow

1. **User**: "I'm having trouble sleeping and I'm stressed about work"

2. **Personal Bearable AI** orchestrates:
   - Identifies relevant specialists: Sleep Expert + Stress Management Therapist
   - Consults both agents for specialist recommendations
   - Synthesizes their advice into cohesive response
   - Suggests actionable next steps

3. **Response includes**:
   - Sleep optimization tips from Dr. Emily Patel
   - Stress management techniques from Dr. James Rodriguez
   - Integrated action plan from Personal Bearable AI
   - Suggested follow-up questions

### Testing Individual Specialists

```typescript
// In browser console:
import { useAgentStore } from './stores/agentStore';

// Initialize agents
useAgentStore.getState().initializeAgents();

// Consult nutrition specialist
await useAgentStore.getState().consultAgent(
  'nutrition-specialist',
  'What should I eat to lower my cholesterol?'
);

// View consultation history
console.log(useAgentStore.getState().consultationHistory);
```

## Deployment

### Deploy to Vercel

The project is already configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Important**: Add all environment variables in Vercel dashboard under **Settings** → **Environment Variables**

### Required Vercel Environment Variables

```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_OPENAI_API_KEY
REACT_APP_ELEVENLABS_API_KEY
REACT_APP_SENTRY_DSN
REACT_APP_ENABLE_VOICE=true
REACT_APP_ENABLE_MULTI_AGENT=true
```

## Cost Estimates (Per 1000 Users/Month)

### Optimized Configuration

- **Supabase**: $25/month (Pro plan for production)
- **OpenAI API**: ~$660 (GPT-4o-mini routing, caching enabled)
- **ElevenLabs**: ~$330 (standard voice tier)
- **Vercel**: $20/month (Pro plan)

**Total**: ~$1,035/month for 1000 active users = **$1.04 per user**

See `COST_ANALYSIS.md` for detailed breakdown and optimization strategies.

## Feature Flags

Control which features are enabled:

```bash
# Enable/disable voice interface
REACT_APP_ENABLE_VOICE=true

# Enable/disable multi-agent consultations
REACT_APP_ENABLE_MULTI_AGENT=true

# Enable/disable persistent memory (requires Pinecone)
REACT_APP_ENABLE_MEMORY=false
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Full Verification (before commits)

```bash
npm run verify
```

## Troubleshooting

### "Missing Supabase credentials" Warning

- Make sure `.env.local` has `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Restart the development server after adding environment variables

### TypeScript Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

1. Check Supabase project is active: https://supabase.com/dashboard
2. Verify project URL and anon key are correct
3. Check Row Level Security policies are enabled (they should be after running schema)

### Voice Not Working

1. Check `REACT_APP_ELEVENLABS_API_KEY` is set
2. Verify ElevenLabs account has sufficient credits
3. Check browser microphone permissions

## Next Steps

1. **Add HealthBank One Integration**: Implement mock medical records API
2. **Build Caregiver Dashboard**: HITL (Human-in-the-Loop) interface for Mayo clinicians
3. **Integrate Wearables**: Connect aggregation API for fitness trackers
4. **Deploy Vector Memory**: Set up Pinecone for advanced personalization
5. **Implement Nudge Engine**: ML-powered behavioral economics system

## Documentation

- **Architecture Design**: `ARCHITECTURE_DESIGN.md`
- **Implementation Guide**: `IMPLEMENTATION_GUIDE.md`
- **Cost Analysis**: `COST_ANALYSIS.md`
- **Tech Stack Decisions**: `TECH_STACK_DECISIONS.md`
- **Consent System**: `docs/CONSENT_SYSTEM_README.md`

## Support

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See `/docs` folder
- Mayo Clinic Pitch Deck: `/Users/jeffl/Downloads/Bearables AI Mayo.pdf`
