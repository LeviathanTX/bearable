import { HealthSpecialistAgent, MultiAgentMessage, HealthConversation, ConversationMode } from '../types';
import { aiServiceManager, AIMessage } from './realAIService';

export interface MultiAgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  confidence: number;
  keyPoints: string[];
  recommendations: string[];
}

export interface ConsensusResult {
  consensusReached: boolean;
  consensusLevel: 'low' | 'medium' | 'high';
  agreedPoints: string[];
  disagreements: string[];
  finalRecommendation: string;
  nextSteps: string[];
}

export class MultiAgentAIService {
  private static fallbackApiKey = process.env.REACT_APP_OPENAI_API_KEY;
  private static baseUrl = 'https://api.openai.com/v1';

  static async generateAgentResponse(
    agent: HealthSpecialistAgent,
    userMessage: string,
    conversationHistory: MultiAgentMessage[],
    conversationMode: ConversationMode
  ): Promise<MultiAgentResponse> {
    try {
      const systemPrompt = this.buildAgentSystemPrompt(agent, conversationMode);
      const conversationContext = this.buildConversationContext(conversationHistory, userMessage);

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationContext }
      ];

      // Try to use configured AI service first
      let responseText: string;
      try {
        const aiResponse = await aiServiceManager.generateResponse(messages, {
          temperature: 0.7,
          maxTokens: 800
        });
        responseText = aiResponse.content;
      } catch (aiError) {
        console.log('Configured AI service failed, trying fallback API:', aiError);

        // Fallback to environment API key if available
        if (this.fallbackApiKey) {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.fallbackApiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: conversationContext }
              ],
              temperature: 0.7,
              max_tokens: 800
            })
          });

          if (!response.ok) {
            throw new Error(`Fallback API error: ${response.status}`);
          }

          const data = await response.json();
          responseText = data.choices[0].message.content;
        } else {
          throw new Error('No AI service configured and no fallback API key available');
        }
      }

      // Parse the response content
      const content = responseText || '';

      return {
        agentId: agent.id,
        agentName: agent.name,
        content,
        confidence: this.calculateConfidence(content, agent.expertise),
        keyPoints: this.extractKeyPoints(content),
        recommendations: this.extractRecommendations(content)
      };
    } catch (error) {
      console.error(`Error generating response for ${agent.name}:`, error);

      // Fallback response
      return this.generateFallbackResponse(agent, userMessage);
    }
  }

  static async generateConsensusResponse(
    facilitator: HealthSpecialistAgent,
    agentResponses: MultiAgentResponse[],
    userMessage: string,
    conversationMode: ConversationMode
  ): Promise<ConsensusResult> {
    try {
      const systemPrompt = this.buildFacilitatorSystemPrompt(facilitator, conversationMode);
      const consensusContext = this.buildConsensusContext(agentResponses, userMessage);

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: consensusContext }
      ];

      // Try to use configured AI service first
      let content: string;
      try {
        const aiResponse = await aiServiceManager.generateResponse(messages, {
          temperature: 0.3,
          maxTokens: 1000
        });
        content = aiResponse.content;
      } catch (aiError) {
        console.log('Configured AI service failed for consensus, trying fallback API:', aiError);

        // Fallback to environment API key if available
        if (this.fallbackApiKey) {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.fallbackApiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages,
              temperature: 0.3,
              max_tokens: 1000
            })
          });

          if (!response.ok) {
            throw new Error(`Fallback API error: ${response.status}`);
          }

          const data = await response.json();
          content = data.choices[0].message.content;
        } else {
          throw new Error('No AI service configured and no fallback API key available');
        }
      }

      return this.parseConsensusResponse(content, agentResponses);
    } catch (error) {
      console.error('Error generating consensus:', error);
      return this.generateFallbackConsensus(agentResponses);
    }
  }

  static async generateMultiAgentResponses(
    selectedAgents: HealthSpecialistAgent[],
    userMessage: string,
    conversationHistory: MultiAgentMessage[],
    conversationMode: ConversationMode
  ): Promise<MultiAgentResponse[]> {
    const responses = await Promise.all(
      selectedAgents.map(agent =>
        this.generateAgentResponse(agent, userMessage, conversationHistory, conversationMode)
      )
    );

    return responses;
  }

  private static buildAgentSystemPrompt(agent: HealthSpecialistAgent, mode: ConversationMode): string {
    const basePrompt = agent.systemPrompt || `You are ${agent.name}, a ${agent.title}.`;

    const expertiseContext = `Your expertise includes: ${agent.expertise.join(', ')}.`;
    const personalityContext = `Your personality traits: ${agent.personalityTraits.join(', ')}.`;
    const credentialsContext = `Your credentials: ${agent.credentials.join(', ')}.`;

    const modeContext = `This is a ${mode.name} session: ${mode.description}.
    The facilitation style is ${mode.facilitationStyle}.`;

    const instructionsContext = `
    Guidelines for your response:
    1. Stay within your area of expertise (${agent.specialization})
    2. Provide evidence-based recommendations when possible
    3. Be specific and actionable in your advice
    4. Consider the user's safety and well-being first
    5. Acknowledge when something is outside your scope
    6. Keep responses focused and under 200 words
    7. Use your communication style: ${agent.communicationStyle}
    ${agent.mayoClinicAffiliation ? '8. Reference Mayo Clinic guidelines when relevant' : ''}
    `;

    return `${basePrompt}\n\n${expertiseContext}\n${personalityContext}\n${credentialsContext}\n\n${modeContext}\n\n${instructionsContext}`;
  }

  private static buildFacilitatorSystemPrompt(facilitator: HealthSpecialistAgent, mode: ConversationMode): string {
    return `You are ${facilitator.name}, the health team facilitator for this ${mode.name} session.

    Your role is to:
    1. Analyze responses from multiple health specialists
    2. Identify areas of agreement and disagreement
    3. Synthesize recommendations into a coherent action plan
    4. Highlight any conflicting advice that needs resolution
    5. Prioritize recommendations based on safety and impact
    6. Ensure all specialist perspectives are acknowledged

    Communication style: ${facilitator.communicationStyle}
    Session type: ${mode.description}

    Please analyze the specialist responses and provide a consensus summary that includes:
    - Key agreed-upon points
    - Any areas of disagreement
    - Prioritized action items
    - Next steps for the patient`;
  }

  private static buildConversationContext(history: MultiAgentMessage[], currentMessage: string): string {
    const recentHistory = history.slice(-6); // Last 6 messages for context

    let context = `Current patient question/concern: "${currentMessage}"\n\n`;

    if (recentHistory.length > 0) {
      context += "Recent conversation context:\n";
      recentHistory.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'Patient' : (msg.agentName || 'Specialist');
        context += `${role}: ${msg.content}\n`;
      });
    }

    context += `\nPlease provide your professional response to the patient's current question, taking into account the conversation context.`;

    return context;
  }

  private static buildConsensusContext(responses: MultiAgentResponse[], userMessage: string): string {
    let context = `Patient's question: "${userMessage}"\n\nSpecialist responses to analyze:\n\n`;

    responses.forEach((response, index) => {
      context += `${response.agentName}:\n${response.content}\n\n`;
    });

    context += `Please analyze these responses and build consensus while highlighting any important disagreements that need attention.`;

    return context;
  }

  private static calculateConfidence(content: string, expertise: string[]): number {
    // Simple confidence calculation based on content indicators
    let confidence = 0.7; // Base confidence

    if (content.includes('I recommend') || content.includes('suggest')) confidence += 0.1;
    if (content.includes('evidence shows') || content.includes('studies indicate')) confidence += 0.15;
    if (content.includes('Mayo Clinic') || content.includes('guidelines')) confidence += 0.1;
    if (content.includes('unclear') || content.includes('not sure')) confidence -= 0.2;
    if (content.includes('outside my expertise')) confidence -= 0.3;

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private static extractKeyPoints(content: string): string[] {
    // Simple extraction - in production this would be more sophisticated
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  private static extractRecommendations(content: string): string[] {
    // Extract action-oriented sentences
    const recommendations = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      if (sentence.match(/\b(recommend|suggest|should|try|consider|start|avoid|stop)\b/i)) {
        recommendations.push(sentence.trim());
      }
    }

    return recommendations.slice(0, 3);
  }

  private static parseConsensusResponse(content: string, responses: MultiAgentResponse[]): ConsensusResult {
    // Parse the AI response to extract consensus information
    const consensusLevel = this.determineConsensusLevel(content, responses);

    return {
      consensusReached: consensusLevel !== 'low',
      consensusLevel,
      agreedPoints: this.extractAgreedPoints(content),
      disagreements: this.extractDisagreements(content),
      finalRecommendation: this.extractFinalRecommendation(content),
      nextSteps: this.extractNextSteps(content)
    };
  }

  private static determineConsensusLevel(content: string, responses: MultiAgentResponse[]): 'low' | 'medium' | 'high' {
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;

    if (content.includes('strong agreement') || content.includes('unanimous')) return 'high';
    if (content.includes('general agreement') || avgConfidence > 0.8) return 'high';
    if (content.includes('some disagreement') || avgConfidence > 0.6) return 'medium';
    return 'low';
  }

  private static extractAgreedPoints(content: string): string[] {
    // Extract points of agreement
    const patterns = [
      /all specialists agree that (.*?)(?=[.!?])/gi,
      /consensus on (.*?)(?=[.!?])/gi,
      /agreed that (.*?)(?=[.!?])/gi
    ];

    const points = [];
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        points.push(...matches.map(m => m.replace(/^(all specialists agree that|consensus on|agreed that)\s*/i, '')));
      }
    }

    return points.slice(0, 3);
  }

  private static extractDisagreements(content: string): string[] {
    // Extract areas of disagreement
    const patterns = [
      /disagreement about (.*?)(?=[.!?])/gi,
      /differing views on (.*?)(?=[.!?])/gi,
      /conflicting advice regarding (.*?)(?=[.!?])/gi
    ];

    const disagreements = [];
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        disagreements.push(...matches.map(m => m.replace(/^(disagreement about|differing views on|conflicting advice regarding)\s*/i, '')));
      }
    }

    return disagreements.slice(0, 2);
  }

  private static extractFinalRecommendation(content: string): string {
    // Extract the main recommendation
    const patterns = [
      /final recommendation:?\s*(.*?)(?=\n|$)/i,
      /we recommend:?\s*(.*?)(?=\n|$)/i,
      /action plan:?\s*(.*?)(?=\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: return first sentence that contains recommendation language
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.match(/\b(recommend|suggest|should|plan)\b/i)) {
        return sentence.trim();
      }
    }

    return 'Please follow the individual specialist recommendations above.';
  }

  private static extractNextSteps(content: string): string[] {
    // Extract next steps
    const patterns = [
      /next steps?:?\s*(.*?)(?=\n|$)/i,
      /follow.?up:?\s*(.*?)(?=\n|$)/i,
      /action items?:?\s*(.*?)(?=\n|$)/i
    ];

    const steps = [];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        steps.push(match[1].trim());
      }
    }

    // Also look for numbered lists
    const numberedSteps = content.match(/\d+\.\s*([^\n]+)/g);
    if (numberedSteps) {
      steps.push(...numberedSteps.map(s => s.replace(/^\d+\.\s*/, '')));
    }

    return steps.slice(0, 4);
  }

  private static generateFallbackResponse(agent: HealthSpecialistAgent, userMessage: string): MultiAgentResponse {
    const fallbackResponses = {
      'primary_care': `As a primary care physician, I'd need more information to provide specific guidance about "${userMessage}". I recommend scheduling a comprehensive evaluation to assess your symptoms and develop an appropriate treatment plan.`,
      'movement': `From an exercise perspective regarding "${userMessage}", movement and physical activity often play important roles in health outcomes. I'd suggest we discuss your current activity level and explore safe, appropriate exercises that might help.`,
      'nutrition': `Regarding "${userMessage}", nutrition often impacts many health conditions. I'd recommend keeping a food diary and considering how dietary factors might be contributing to your concerns. A comprehensive nutritional assessment would be beneficial.`,
      'mental_health': `Mental health and physical health are closely connected. Regarding "${userMessage}", stress, anxiety, and mood can significantly impact physical symptoms. I'd recommend exploring both the psychological and physical aspects of your concern.`,
      'sleep': `Sleep quality affects many aspects of health. For "${userMessage}", I'd want to understand your sleep patterns, as poor sleep can contribute to various health issues. A sleep evaluation might provide valuable insights.`,
      'wellness_coaching': `As your health coach, I want to understand all aspects of "${userMessage}" to help coordinate the best care approach. Let's work together with the team to address your concerns comprehensively.`
    };

    const content = fallbackResponses[agent.specialization as keyof typeof fallbackResponses] ||
                   `Thank you for your question about "${userMessage}". I'd like to provide more specific guidance, but I'd need additional information to give you the most appropriate recommendations.`;

    return {
      agentId: agent.id,
      agentName: agent.name,
      content,
      confidence: 0.5,
      keyPoints: [content.split('.')[0]],
      recommendations: ['Schedule follow-up consultation', 'Provide more detailed information']
    };
  }

  private static generateFallbackConsensus(responses: MultiAgentResponse[]): ConsensusResult {
    const agentNames = responses.map(r => r.agentName).join(', ');

    return {
      consensusReached: true,
      consensusLevel: 'medium',
      agreedPoints: [
        'All specialists agree this requires personalized assessment',
        'Multiple factors may be contributing to your concerns',
        'Coordinated care approach is recommended'
      ],
      disagreements: [],
      finalRecommendation: `Our team of specialists (${agentNames}) recommends a comprehensive, coordinated approach to address your concerns. Each specialist will work together to ensure you receive the most appropriate care.`,
      nextSteps: [
        'Schedule individual consultations as recommended',
        'Gather additional information as suggested',
        'Follow up with the care team',
        'Monitor symptoms and progress'
      ]
    };
  }
}