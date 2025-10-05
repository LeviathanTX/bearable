# Implementation Guide: Personal AI Companion

## Quick Start Implementation

This guide provides concrete code examples and patterns for implementing the Personal AI Companion architecture.

---

## Table of Contents

1. [Memory System Implementation](#memory-system-implementation)
2. [Multi-Agent Setup](#multi-agent-setup)
3. [Voice Integration](#voice-integration)
4. [Behavioral Nudge Engine](#behavioral-nudge-engine)
5. [Privacy & Security](#privacy--security)
6. [Deployment & Monitoring](#deployment--monitoring)

---

## Memory System Implementation

### 1. Setup Pinecone Vector Database

```bash
# Install dependencies
npm install @pinecone-database/pinecone openai langchain @langchain/pinecone

# Environment variables
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=us-east-1
OPENAI_API_KEY=your_key_here
```

```typescript
// lib/memory/pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';

export class VectorMemoryStore {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private indexName = 'bearable-memory';

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      dimensions: 3072
    });
  }

  async initialize(): Promise<void> {
    // Check if index exists
    const indexes = await this.pinecone.listIndexes();

    if (!indexes.indexes?.find(i => i.name === this.indexName)) {
      // Create serverless index
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: 3072,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });

      // Wait for index to be ready
      await this.waitForIndex();
    }
  }

  async addMemory(
    userId: string,
    content: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const index = this.pinecone.Index(this.indexName);

    const vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      {
        pineconeIndex: index,
        namespace: userId
      }
    );

    await vectorStore.addDocuments([{
      pageContent: content,
      metadata: {
        ...metadata,
        userId,
        timestamp: Date.now()
      }
    }]);
  }

  async search(
    userId: string,
    query: string,
    options: { topK?: number, filter?: any } = {}
  ): Promise<MemoryResult[]> {
    const index = this.pinecone.Index(this.indexName);

    const vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      {
        pineconeIndex: index,
        namespace: userId
      }
    );

    const results = await vectorStore.similaritySearchWithScore(
      query,
      options.topK || 5,
      options.filter
    );

    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score
    }));
  }

  private async waitForIndex(): Promise<void> {
    let ready = false;
    while (!ready) {
      const index = await this.pinecone.describeIndex(this.indexName);
      ready = index.status?.ready || false;
      if (!ready) await new Promise(r => setTimeout(r, 1000));
    }
  }
}

interface MemoryResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}
```

### 2. Memory Extraction Pipeline

```typescript
// lib/memory/extractor.ts
import { ChatOpenAI } from '@langchain/openai';

export class MemoryExtractor {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0
    });
  }

  async extractFacts(interaction: {
    user: string;
    assistant: string;
    context?: string;
  }): Promise<ExtractedFact[]> {
    const prompt = `Extract key facts and information from this health coaching conversation.
Focus on:
1. User goals and intentions
2. Health conditions or concerns
3. Preferences and constraints
4. Action items or commitments
5. Important context

Conversation:
User: ${interaction.user}
Assistant: ${interaction.assistant}
${interaction.context ? `Context: ${interaction.context}` : ''}

Return a JSON array of facts with structure:
{
  "type": "goal" | "preference" | "condition" | "action" | "context",
  "subject": "who or what",
  "predicate": "relationship or state",
  "object": "target or value",
  "confidence": 0-1,
  "temporal": "ongoing" | "past" | "future"
}`;

    const response = await this.llm.invoke(prompt);
    return JSON.parse(response.content as string);
  }

  async extractEntities(text: string): Promise<Entity[]> {
    const prompt = `Extract entities from this text.
Return JSON array with:
{
  "text": "entity text",
  "type": "person" | "condition" | "medication" | "activity" | "food" | "goal",
  "confidence": 0-1
}

Text: ${text}`;

    const response = await this.llm.invoke(prompt);
    return JSON.parse(response.content as string);
  }
}

interface ExtractedFact {
  type: 'goal' | 'preference' | 'condition' | 'action' | 'context';
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  temporal: 'ongoing' | 'past' | 'future';
}

interface Entity {
  text: string;
  type: string;
  confidence: number;
}
```

### 3. Complete Memory System

```typescript
// lib/memory/system.ts
import { VectorMemoryStore } from './pinecone';
import { MemoryExtractor } from './extractor';
import { Redis } from '@upstash/redis';

export class PersonalMemorySystem {
  private vectorStore: VectorMemoryStore;
  private extractor: MemoryExtractor;
  private cache: Redis;

  constructor() {
    this.vectorStore = new VectorMemoryStore();
    this.extractor = new MemoryExtractor();
    this.cache = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async addInteraction(
    userId: string,
    interaction: {
      user: string;
      assistant: string;
      timestamp: number;
    }
  ): Promise<void> {
    // Extract facts
    const facts = await this.extractor.extractFacts(interaction);

    // Store each fact in vector DB
    for (const fact of facts) {
      await this.vectorStore.addMemory(
        userId,
        `${fact.subject} ${fact.predicate} ${fact.object}`,
        {
          type: fact.type,
          confidence: fact.confidence,
          temporal: fact.temporal,
          timestamp: interaction.timestamp
        }
      );
    }

    // Update rolling summary
    await this.updateSummary(userId, interaction);

    // Invalidate cache
    await this.cache.del(`context:${userId}`);
  }

  async recall(
    userId: string,
    query: string,
    options: RecallOptions = {}
  ): Promise<RecallResult> {
    // Check cache first
    const cacheKey = `context:${userId}:${query}`;
    const cached = await this.cache.get<RecallResult>(cacheKey);
    if (cached) return cached;

    // Search vector store
    const memories = await this.vectorStore.search(userId, query, {
      topK: options.topK || 5,
      filter: options.filter
    });

    // Get summary
    const summary = await this.getSummary(userId);

    const result: RecallResult = {
      memories,
      summary,
      relevanceScore: this.calculateRelevance(memories)
    };

    // Cache for 5 minutes
    await this.cache.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  private async updateSummary(
    userId: string,
    interaction: any
  ): Promise<void> {
    const existingSummary = await this.getSummary(userId);

    const prompt = `Update this user summary with the new interaction.
Keep it concise (max 500 tokens).

Existing summary:
${existingSummary || 'No previous summary'}

New interaction:
User: ${interaction.user}
Assistant: ${interaction.assistant}

Updated summary:`;

    const llm = new ChatOpenAI({ modelName: 'gpt-4o-mini' });
    const response = await llm.invoke(prompt);

    await this.cache.set(
      `summary:${userId}`,
      response.content as string,
      { ex: 86400 } // 24 hours
    );
  }

  private async getSummary(userId: string): Promise<string | null> {
    return await this.cache.get(`summary:${userId}`);
  }

  private calculateRelevance(memories: any[]): number {
    if (memories.length === 0) return 0;
    return memories.reduce((sum, m) => sum + m.score, 0) / memories.length;
  }
}

interface RecallOptions {
  topK?: number;
  filter?: any;
}

interface RecallResult {
  memories: any[];
  summary: string | null;
  relevanceScore: number;
}
```

---

## Multi-Agent Setup

### 1. Install LangGraph

```bash
npm install @langchain/langgraph @langchain/openai @langchain/anthropic
```

### 2. Define Agent State

```typescript
// lib/agents/state.ts
import { Annotation } from "@langchain/langgraph";

export const CompanionState = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (x, y) => x.concat(y)
  }),

  userContext: Annotation<UserContext>({
    reducer: (_, y) => y
  }),

  activeSpecialists: Annotation<string[]>({
    reducer: (x, y) => [...new Set([...x, ...y])]
  }),

  memory: Annotation<Memory[]>({
    reducer: (x, y) => x.concat(y)
  }),

  nextAction: Annotation<string>({
    reducer: (_, y) => y
  })
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UserContext {
  userId: string;
  preferences: any;
  currentGoals: string[];
}

interface Memory {
  content: string;
  relevance: number;
}
```

### 3. Create Agent Nodes

```typescript
// lib/agents/nodes.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export async function mainCompanionNode(state: typeof CompanionState.State) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7
  });

  const systemPrompt = `You are a warm, empathetic health companion.
Your role is to:
1. Listen actively and respond with empathy
2. Route complex questions to specialists
3. Remember user context and preferences
4. Encourage healthy behaviors

Current context:
${state.memory.map(m => m.content).join('\n')}

User goals: ${state.userContext.currentGoals.join(', ')}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...state.messages.slice(-5) // Last 5 messages
  ];

  const response = await llm.invoke(messages);

  return {
    messages: [{
      role: 'assistant' as const,
      content: response.content as string,
      timestamp: Date.now()
    }],
    nextAction: determineNextAction(response.content as string)
  };
}

export async function healthSpecialistNode(state: typeof CompanionState.State) {
  const llm = new ChatAnthropic({
    modelName: "claude-3-opus-20240229",
    temperature: 0.3
  });

  const systemPrompt = `You are a health specialist with expertise in lifestyle medicine.
Reference Mayo Clinic protocols for evidence-based guidance.

User context: ${JSON.stringify(state.userContext)}
Relevant memories: ${state.memory.map(m => m.content).join('\n')}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    ...state.messages.slice(-3)
  ]);

  return {
    messages: [{
      role: 'assistant' as const,
      content: response.content as string,
      timestamp: Date.now()
    }],
    activeSpecialists: ['health']
  };
}

export async function nutritionExpertNode(state: typeof CompanionState.State) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.5
  });

  const systemPrompt = `You are a nutrition expert specializing in evidence-based dietary guidance.

User preferences: ${JSON.stringify(state.userContext.preferences)}
Dietary goals: ${state.userContext.currentGoals.filter(g => g.includes('nutrition') || g.includes('diet'))}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    ...state.messages.slice(-3)
  ]);

  return {
    messages: [{
      role: 'assistant' as const,
      content: response.content as string,
      timestamp: Date.now()
    }],
    activeSpecialists: ['nutrition']
  };
}

function determineNextAction(response: string): string {
  // Simple intent detection
  const lowerResponse = response.toLowerCase();

  if (lowerResponse.includes('consult') || lowerResponse.includes('specialist')) {
    return 'route_to_specialist';
  }

  if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest')) {
    return 'nudge';
  }

  return 'continue';
}
```

### 4. Build the Graph

```typescript
// lib/agents/graph.ts
import { StateGraph, END } from "@langchain/langgraph";
import { CompanionState } from "./state";
import {
  mainCompanionNode,
  healthSpecialistNode,
  nutritionExpertNode
} from "./nodes";

// Routing function
function shouldRouteToSpecialist(state: typeof CompanionState.State) {
  const lastMessage = state.messages[state.messages.length - 1].content.toLowerCase();

  // Check for health-related keywords
  if (/symptom|pain|medication|condition|doctor/i.test(lastMessage)) {
    return 'health';
  }

  // Check for nutrition-related keywords
  if (/diet|food|meal|nutrition|calorie|vitamin/i.test(lastMessage)) {
    return 'nutrition';
  }

  // Continue with main companion
  if (state.nextAction === 'continue') {
    return 'end';
  }

  return 'main';
}

// Build the graph
const workflow = new StateGraph(CompanionState)
  .addNode("main", mainCompanionNode)
  .addNode("health", healthSpecialistNode)
  .addNode("nutrition", nutritionExpertNode)
  .addEdge("__start__", "main")
  .addConditionalEdges(
    "main",
    shouldRouteToSpecialist,
    {
      health: "health",
      nutrition: "nutrition",
      end: END,
      main: "main"
    }
  )
  .addEdge("health", "main")
  .addEdge("nutrition", "main");

export const companionGraph = workflow.compile();
```

### 5. Use the Agent System

```typescript
// lib/agents/service.ts
import { companionGraph } from './graph';
import { PersonalMemorySystem } from '../memory/system';

export class CompanionAgentService {
  private memory: PersonalMemorySystem;

  constructor() {
    this.memory = new PersonalMemorySystem();
  }

  async chat(
    userId: string,
    message: string,
    userContext: any
  ): Promise<string> {
    // Recall relevant memories
    const recallResult = await this.memory.recall(userId, message);

    // Invoke the graph
    const result = await companionGraph.invoke({
      messages: [{
        role: 'user' as const,
        content: message,
        timestamp: Date.now()
      }],
      userContext,
      activeSpecialists: [],
      memory: recallResult.memories.map(m => ({
        content: m.content,
        relevance: m.score
      })),
      nextAction: 'continue'
    });

    // Get the assistant's response
    const assistantMessage = result.messages
      .filter((m: any) => m.role === 'assistant')
      .pop();

    // Store the interaction
    await this.memory.addInteraction(userId, {
      user: message,
      assistant: assistantMessage.content,
      timestamp: Date.now()
    });

    return assistantMessage.content;
  }
}
```

---

## Voice Integration

### 1. ElevenLabs Setup

```bash
npm install @11labs/client
```

```typescript
// lib/voice/elevenlabs.ts
import { Conversation } from '@11labs/client';

export class ElevenLabsVoiceService {
  private conversation: Conversation | null = null;
  private onTranscript?: (text: string) => void;
  private onResponse?: (text: string) => void;

  async initialize(config: {
    userId: string;
    systemPrompt: string;
    onTranscript?: (text: string) => void;
    onResponse?: (text: string) => void;
  }): Promise<void> {
    this.onTranscript = config.onTranscript;
    this.onResponse = config.onResponse;

    this.conversation = await Conversation.create({
      agentId: process.env.ELEVENLABS_AGENT_ID!,

      clientSettings: {
        voice: {
          voiceId: process.env.ELEVENLABS_VOICE_ID!
        },
        turnTakingMode: 'natural',
        languageModel: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.7
        }
      },

      systemPrompt: config.systemPrompt,

      transport: {
        type: 'webrtc'
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.conversation) return;

    // Partial transcript (live updates)
    this.conversation.on('partialTranscript', (text) => {
      this.onTranscript?.(text);
    });

    // Final transcript
    this.conversation.on('transcript', (text) => {
      this.onTranscript?.(text);
    });

    // Agent response
    this.conversation.on('agentTurnComplete', (data) => {
      this.onResponse?.(data.text);
    });

    // Error handling
    this.conversation.on('error', (error) => {
      console.error('Voice conversation error:', error);
    });
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.conversation) {
      throw new Error('Conversation not initialized');
    }

    await this.conversation.sendAudio(audioData);
  }

  async stopSpeaking(): Promise<void> {
    if (!this.conversation) return;
    await this.conversation.stopSpeaking();
  }

  async endConversation(): Promise<void> {
    if (!this.conversation) return;
    await this.conversation.end();
    this.conversation = null;
  }
}
```

### 2. React Voice Component

```typescript
// components/VoiceChat.tsx
import { useEffect, useRef, useState } from 'react';
import { ElevenLabsVoiceService } from '@/lib/voice/elevenlabs';

export function VoiceChat({ userId, systemPrompt }: {
  userId: string;
  systemPrompt: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  const voiceService = useRef<ElevenLabsVoiceService>();
  const mediaRecorder = useRef<MediaRecorder>();
  const audioStream = useRef<MediaStream>();

  useEffect(() => {
    voiceService.current = new ElevenLabsVoiceService();

    voiceService.current.initialize({
      userId,
      systemPrompt,
      onTranscript: setTranscript,
      onResponse: setResponse
    });

    return () => {
      voiceService.current?.endConversation();
    };
  }, [userId, systemPrompt]);

  const startRecording = async () => {
    try {
      audioStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        }
      });

      mediaRecorder.current = new MediaRecorder(audioStream.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const arrayBuffer = await event.data.arrayBuffer();
          await voiceService.current?.sendAudio(arrayBuffer);
        }
      };

      mediaRecorder.current.start(100); // Send chunks every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    audioStream.current?.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const handleInterrupt = async () => {
    await voiceService.current?.stopSpeaking();
  };

  return (
    <div className="voice-chat">
      <div className="transcript">
        <h3>You said:</h3>
        <p>{transcript || 'Click mic to start speaking...'}</p>
      </div>

      <div className="response">
        <h3>AI Response:</h3>
        <p>{response || 'Listening...'}</p>
      </div>

      <div className="controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'recording' : ''}
        >
          {isRecording ? 'Stop' : 'Start'} Recording
        </button>

        <button
          onClick={handleInterrupt}
          disabled={!response}
        >
          Interrupt
        </button>
      </div>
    </div>
  );
}
```

---

## Behavioral Nudge Engine

### 1. Nudge Types

```typescript
// lib/nudges/types.ts
export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  deliveryMethod: 'push' | 'in_app' | 'voice' | 'email';
  timing: {
    trigger: 'time' | 'event' | 'context';
    value: any;
  };
  personalization: {
    userId: string;
    variant: string;
    context: any;
  };
}

export type NudgeType =
  | 'social_proof'
  | 'loss_aversion'
  | 'gamification'
  | 'commitment'
  | 'default'
  | 'temporal';

export interface NudgeTemplate {
  type: NudgeType;
  variants: {
    [key: string]: {
      title: string;
      message: string;
      effectiveness?: number;
    };
  };
}
```

### 2. Nudge Engine

```typescript
// lib/nudges/engine.ts
import { Redis } from '@upstash/redis';

export class BehavioralNudgeEngine {
  private redis: Redis;
  private templates: Map<string, NudgeTemplate>;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });

    this.templates = this.loadTemplates();
  }

  async selectNudge(
    userId: string,
    context: NudgeContext
  ): Promise<Nudge | null> {
    // Get user's nudge history
    const history = await this.getNudgeHistory(userId);

    // Get user's response patterns
    const patterns = await this.analyzeResponsePatterns(userId);

    // Select best nudge type based on context and patterns
    const nudgeType = this.selectNudgeType(context, patterns);

    if (!nudgeType) return null;

    // A/B test variant selection
    const variant = await this.selectVariant(userId, nudgeType);

    // Build personalized nudge
    const template = this.templates.get(nudgeType);
    if (!template) return null;

    const variantData = template.variants[variant];

    return {
      id: `nudge_${Date.now()}`,
      type: nudgeType,
      title: this.personalize(variantData.title, context),
      message: this.personalize(variantData.message, context),
      deliveryMethod: this.selectDeliveryMethod(userId, context),
      timing: {
        trigger: context.trigger,
        value: context.triggerValue
      },
      personalization: {
        userId,
        variant,
        context
      }
    };
  }

  private selectNudgeType(
    context: NudgeContext,
    patterns: ResponsePatterns
  ): NudgeType | null {
    // Rule-based + ML selection

    // If user has a streak, use loss aversion
    if (context.streak && context.streak >= 3) {
      return 'loss_aversion';
    }

    // If user responds well to social proof
    if (patterns.socialProofEffectiveness > 0.7) {
      return 'social_proof';
    }

    // If user needs motivation
    if (context.recentActivity < context.targetActivity * 0.5) {
      return 'gamification';
    }

    // Default to commitment
    return 'commitment';
  }

  private async selectVariant(
    userId: string,
    nudgeType: NudgeType
  ): Promise<string> {
    // Hash-based A/B testing
    const hash = this.hashUserId(userId);
    const variants = Object.keys(
      this.templates.get(nudgeType)?.variants || {}
    );

    return variants[hash % variants.length] || 'control';
  }

  private loadTemplates(): Map<string, NudgeTemplate> {
    const templates = new Map<string, NudgeTemplate>();

    templates.set('loss_aversion', {
      type: 'loss_aversion',
      variants: {
        control: {
          title: 'Keep Your Streak!',
          message: "You're on a {streak}-day streak. Don't break it now!"
        },
        strong: {
          title: 'About to Lose Your Progress?',
          message: "You've worked {streak} days for this. One more action to keep it alive!"
        },
        gentle: {
          title: 'Your Streak is Waiting',
          message: '{streak} days of progress. Ready to continue?'
        }
      }
    });

    templates.set('social_proof', {
      type: 'social_proof',
      variants: {
        control: {
          title: 'Join Others',
          message: '{peerCount} people like you completed this today!'
        },
        specific: {
          title: 'You\'re Not Alone',
          message: '{peerCount} people with similar goals logged activity in the last hour.'
        }
      }
    });

    templates.set('gamification', {
      type: 'gamification',
      variants: {
        control: {
          title: 'Unlock Achievement',
          message: 'Complete one more activity to unlock "{badge}"!'
        },
        progress: {
          title: 'Almost There!',
          message: 'You\'re {progress}% to your next level. Keep going!'
        }
      }
    });

    return templates;
  }

  private personalize(template: string, context: any): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return context[key] || '';
    });
  }

  private selectDeliveryMethod(
    userId: string,
    context: NudgeContext
  ): 'push' | 'in_app' | 'voice' | 'email' {
    // Time-based delivery
    const hour = new Date().getHours();

    if (hour >= 22 || hour <= 7) {
      return 'in_app'; // Quiet hours
    }

    if (context.isActive) {
      return 'voice'; // User is actively using the app
    }

    return 'push'; // Default
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private async getNudgeHistory(userId: string): Promise<any[]> {
    const history = await this.redis.get(`nudge_history:${userId}`);
    return history ? JSON.parse(history as string) : [];
  }

  private async analyzeResponsePatterns(
    userId: string
  ): Promise<ResponsePatterns> {
    const history = await this.getNudgeHistory(userId);

    const patterns: ResponsePatterns = {
      socialProofEffectiveness: 0,
      lossAversionEffectiveness: 0,
      gamificationEffectiveness: 0
    };

    if (history.length === 0) return patterns;

    // Calculate effectiveness for each type
    for (const nudge of history) {
      const key = `${nudge.type}Effectiveness` as keyof ResponsePatterns;
      if (key in patterns) {
        patterns[key] += nudge.converted ? 1 : 0;
      }
    }

    // Normalize
    for (const key in patterns) {
      patterns[key as keyof ResponsePatterns] /= history.length;
    }

    return patterns;
  }
}

interface NudgeContext {
  trigger: 'time' | 'event' | 'context';
  triggerValue: any;
  streak?: number;
  recentActivity?: number;
  targetActivity?: number;
  isActive?: boolean;
  [key: string]: any;
}

interface ResponsePatterns {
  socialProofEffectiveness: number;
  lossAversionEffectiveness: number;
  gamificationEffectiveness: number;
}
```

### 3. A/B Testing Analytics

```typescript
// lib/nudges/analytics.ts
export class NudgeAnalytics {
  async trackNudgeShown(nudge: Nudge): Promise<void> {
    await fetch('/api/analytics/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'nudge_shown',
        userId: nudge.personalization.userId,
        nudgeType: nudge.type,
        variant: nudge.personalization.variant,
        timestamp: Date.now()
      })
    });
  }

  async trackNudgeEngagement(
    nudgeId: string,
    converted: boolean
  ): Promise<void> {
    await fetch('/api/analytics/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'nudge_engagement',
        nudgeId,
        converted,
        timestamp: Date.now()
      })
    });
  }

  async analyzeExperiment(
    nudgeType: NudgeType
  ): Promise<ExperimentResults> {
    const response = await fetch(
      `/api/analytics/experiment?type=${nudgeType}`
    );

    return response.json();
  }
}

interface ExperimentResults {
  variants: {
    [key: string]: {
      exposures: number;
      conversions: number;
      conversionRate: number;
    };
  };
  winner: string | null;
  confidence: number;
  recommendation: string;
}
```

---

## Privacy & Security

### 1. Edge Encryption

```typescript
// lib/security/encryption.ts
import { subtle } from 'crypto';

export class EdgeEncryption {
  private static async getKey(userId: string): Promise<CryptoKey> {
    const keyMaterial = await subtle.importKey(
      'raw',
      new TextEncoder().encode(userId + process.env.ENCRYPTION_SECRET),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('bearable-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(
    data: string,
    userId: string
  ): Promise<EncryptedData> {
    const key = await this.getKey(userId);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );

    return {
      data: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64')
    };
  }

  static async decrypt(
    encrypted: EncryptedData,
    userId: string
  ): Promise<string> {
    const key = await this.getKey(userId);

    const decrypted = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: Buffer.from(encrypted.iv, 'base64')
      },
      key,
      Buffer.from(encrypted.data, 'base64')
    );

    return new TextDecoder().decode(decrypted);
  }
}

interface EncryptedData {
  data: string;
  iv: string;
}
```

### 2. Differential Privacy

```typescript
// lib/security/privacy.ts
export class DifferentialPrivacy {
  private epsilon: number = 0.1; // Privacy budget

  addNoise(value: number): number {
    // Laplace mechanism
    const scale = 1 / this.epsilon;
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

    return value + noise;
  }

  async aggregateWithPrivacy(
    values: number[]
  ): Promise<number> {
    const sum = values.reduce((a, b) => a + b, 0);
    const noisySum = this.addNoise(sum);

    return noisySum / values.length;
  }

  async queryWithPrivacy<T>(
    query: () => Promise<T>,
    sensitivity: number
  ): Promise<T> {
    const result = await query();

    // Add noise based on query sensitivity
    if (typeof result === 'number') {
      return this.addNoise(result as number) as T;
    }

    return result;
  }
}
```

---

## Deployment & Monitoring

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "PINECONE_API_KEY": "@pinecone-api-key",
    "ELEVENLABS_API_KEY": "@elevenlabs-api-key"
  },
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### 2. Monitoring Setup

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,

  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.data) {
      event.request.data = '[Filtered]';
    }

    return event;
  }
});
```

### 3. Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  static async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      // Send to analytics
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          duration,
          success: true,
          timestamp: Date.now()
        })
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          duration,
          success: false,
          error: error.message,
          timestamp: Date.now()
        })
      });

      throw error;
    }
  }
}
```

---

## Next Steps

1. **Week 1**: Implement memory system
2. **Week 2**: Build multi-agent orchestration
3. **Week 3**: Integrate voice pipeline
4. **Week 4**: Deploy nudge engine
5. **Week 5**: Add privacy & security
6. **Week 6**: Production deployment

Each implementation can be done incrementally while maintaining the existing Bearable Health Coach functionality.
