import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { useAgentStore, type AgentSpecialty, type AgentConsultation } from '../stores/agentStore';
import { useConversationStore } from '../stores/conversationStore';
import { useUserStore } from '../stores/userStore';
import type { Message } from '../types';

export interface AIResponse {
  content: string;
  consultedAgents: AgentConsultation[];
  suggestedActions: string[];
  emotionalTone: string;
  confidence: number;
}

export class AIOrchestrator {
  private primaryAI: ChatOpenAI;
  private routerAI: ChatOpenAI;

  constructor() {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';

    this.primaryAI = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: apiKey,
    });

    this.routerAI = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      openAIApiKey: apiKey,
    });
  }

  /**
   * Main orchestration method - determines if specialist consultation is needed
   */
  async processUserMessage(userMessage: string): Promise<AIResponse> {
    const { currentUser } = useUserStore.getState();
    const { currentConversation } = useConversationStore.getState();
    const { getRelevantAgents, consultAgent } = useAgentStore.getState();

    if (!currentUser) {
      throw new Error('No user context available');
    }

    // Step 1: Analyze intent and determine if specialist consultation is needed
    const relevantAgents = await getRelevantAgents(userMessage);
    const consultations: AgentConsultation[] = [];

    // Step 2: Consult relevant specialist agents
    if (relevantAgents.length > 0) {
      console.log(`Consulting ${relevantAgents.length} specialist agents...`);

      for (const agent of relevantAgents.slice(0, 2)) { // Limit to 2 consultations for cost
        try {
          const consultation = await this.consultSpecialist(agent.id, userMessage);
          consultations.push(consultation);
        } catch (error) {
          console.error(`Failed to consult ${agent.name}:`, error);
        }
      }
    }

    // Step 3: Generate final response with Personal Bearable AI
    const response = await this.generateResponse(userMessage, consultations, currentConversation?.messages || []);

    return response;
  }

  /**
   * Consult a specialist agent with context
   */
  private async consultSpecialist(agentId: string, query: string): Promise<AgentConsultation> {
    const { agents } = useAgentStore.getState();
    const agent = agents.find(a => a.id === agentId);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const messages = [
      new SystemMessage(agent.systemPrompt),
      new HumanMessage(`As a specialist consultant, please provide your expert recommendation for this user query:\n\n"${query}"\n\nProvide a concise, actionable response (2-3 sentences).`),
    ];

    const response = await this.primaryAI.invoke(messages);

    const consultation: AgentConsultation = {
      id: `consultation-${Date.now()}-${agentId}`,
      agentId: agent.id,
      agentName: agent.name,
      specialty: agent.specialty,
      query,
      response: response.content as string,
      confidence: 0.85,
      timestamp: new Date(),
      usedInResponse: true,
    };

    // Add to store
    useAgentStore.getState().addConsultation(consultation);

    return consultation;
  }

  /**
   * Generate final response from Personal Bearable AI
   */
  private async generateResponse(
    userMessage: string,
    consultations: AgentConsultation[],
    conversationHistory: Message[]
  ): Promise<AIResponse> {
    const { currentUser } = useUserStore.getState();

    if (!currentUser) {
      throw new Error('No user context available');
    }

    // Build conversation context
    const messages = [];

    // System prompt for Personal Bearable AI
    messages.push(new SystemMessage(`You are Bearable, ${currentUser.name}'s personal AI health companion. You are warm, empathetic, and supportive while being evidence-based and actionable.

Your core principles:
1. **Lifestyle Medicine First**: Focus on the 6 pillars (nutrition, physical activity, sleep, stress management, social connection, substance avoidance)
2. **Behavioral Economics**: Use gentle nudges, social proof, gamification, and loss aversion to encourage healthy behaviors
3. **Personalization**: Learn from ${currentUser.name}'s preferences, goals, and past interactions
4. **Mayo Clinic Excellence**: When you consult with specialist agents, synthesize their advice into a cohesive, actionable plan
5. **Human-in-the-Loop**: Recognize when professional medical guidance is needed and suggest caregiver involvement

Communication style: ${currentUser.preferences.communicationStyle}

User's current health context:
- Conditions: ${currentUser.healthProfile.conditions.join(', ') || 'None reported'}
- Medications: ${currentUser.healthProfile.medications.join(', ') || 'None reported'}
- Activity Level: ${currentUser.healthProfile.lifestyle.activityLevel}
- Stress Level: ${currentUser.healthProfile.lifestyle.stressLevel}/5

${consultations.length > 0 ? `\nYou have consulted with specialist agents. Here are their recommendations:\n\n${consultations.map(c => `**${c.agentName}** (${c.specialty}):\n${c.response}`).join('\n\n')}` : ''}

Synthesize any specialist advice into YOUR response naturally - don't just quote them. Make it feel like a cohesive conversation from you, Bearable.`));

    // Add recent conversation history (last 5 messages)
    const recentMessages = conversationHistory.slice(-5);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Add current user message
    messages.push(new HumanMessage(userMessage));

    // Generate response
    const response = await this.primaryAI.invoke(messages);
    const content = response.content as string;

    // Extract suggested actions (simple pattern matching for now)
    const suggestedActions = this.extractSuggestedActions(content);

    // Analyze emotional tone
    const emotionalTone = await this.analyzeEmotionalTone(userMessage);

    return {
      content,
      consultedAgents: consultations,
      suggestedActions,
      emotionalTone,
      confidence: 0.9,
    };
  }

  /**
   * Extract action items from AI response
   */
  private extractSuggestedActions(response: string): string[] {
    const actions: string[] = [];

    // Look for action-oriented phrases
    const actionPatterns = [
      /(?:try|consider|start|begin|practice|aim for|focus on)\s+([^.!?]+)/gi,
      /(?:i suggest|i recommend|you could|you might)\s+([^.!?]+)/gi,
    ];

    for (const pattern of actionPatterns) {
      const matches = Array.from(response.matchAll(pattern));
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 100) {
          actions.push(match[1].trim());
        }
      }
    }

    return actions.slice(0, 3); // Limit to 3 actions
  }

  /**
   * Analyze emotional tone of user message
   */
  private async analyzeEmotionalTone(message: string): Promise<string> {
    // Simple keyword-based analysis for now
    // TODO: Use sentiment analysis model
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.match(/\b(anxious|worried|stressed|overwhelmed|scared)\b/)) {
      return 'anxious';
    } else if (lowerMessage.match(/\b(happy|excited|great|wonderful|amazing)\b/)) {
      return 'positive';
    } else if (lowerMessage.match(/\b(sad|depressed|down|hopeless|tired)\b/)) {
      return 'low';
    } else if (lowerMessage.match(/\b(frustrated|angry|annoyed|irritated)\b/)) {
      return 'frustrated';
    }

    return 'neutral';
  }

  /**
   * Generate suggested follow-up responses
   */
  async generateSuggestedResponses(context: string): Promise<string[]> {
    const messages = [
      new SystemMessage('Generate 3 short, natural follow-up questions or responses a user might say in this health conversation. Keep each under 10 words. Return as JSON array.'),
      new HumanMessage(context),
    ];

    const response = await this.routerAI.invoke(messages);
    const content = response.content as string;

    try {
      const suggestions = JSON.parse(content);
      return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    } catch {
      // Fallback suggestions
      return [
        'Tell me more',
        'What should I do next?',
        'How do I start?',
      ];
    }
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();
