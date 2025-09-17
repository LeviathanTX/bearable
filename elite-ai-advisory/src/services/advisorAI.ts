import { CelebrityAdvisor, AIServiceConfig } from '../types';
import { SecureAIServiceClient, AIMessage, createSecureAIClient } from './secureAIService';

export class AdvisorAI {
  private client: SecureAIServiceClient;

  constructor(config: AIServiceConfig) {
    this.client = createSecureAIClient(config);
  }

  async generatePitchFeedback(
    advisor: CelebrityAdvisor,
    pitchText: string,
    analysisType?: string
  ): Promise<{
    feedback: string;
    strengths: string[];
    improvements: string[];
    overallScore: number;
  }> {
    const systemPrompt = this.buildAdvisorSystemPrompt(advisor, 'pitch_analysis');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Please analyze this pitch and provide feedback in the following JSON format:
{
  "feedback": "detailed feedback paragraph as ${advisor.name}",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overallScore": 85
}

Pitch to analyze:
${pitchText}`
      }
    ];

    console.log('AdvisorAI: About to call generateResponse');
    const response = await this.client.generateResponse(messages, {
      temperature: 0.7,
      maxTokens: 1000
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      // Fallback to structured parsing if JSON fails
      return this.parseStructuredResponse(response.content);
    }
  }

  async generateStrategicResponse(
    advisor: CelebrityAdvisor,
    topic: string,
    userMessage: string,
    conversationHistory: string[] = []
  ): Promise<string> {
    const systemPrompt = this.buildAdvisorSystemPrompt(advisor, 'strategic_planning');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}

You are in a strategic planning discussion about: ${topic}

Previous conversation context:
${conversationHistory.slice(-5).join('\n')}

Respond as ${advisor.name} with specific, actionable advice in 2-3 sentences. Stay true to their communication style and expertise.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    console.log('AdvisorAI: About to call generateResponse');
    const response = await this.client.generateResponse(messages, {
      temperature: 0.8,
      maxTokens: 300
    });

    return response.content;
  }

  async generateResponseWithCustomPrompt(
    customSystemPrompt: string,
    userMessage: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: customSystemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    console.log('AdvisorAI: About to call generateResponse with custom prompt');
    const response = await this.client.generateResponse(messages, {
      temperature: options?.temperature || 0.8,
      maxTokens: options?.maxTokens || 1000
    });

    return response.content;
  }

  async generateDueDiligenceAnalysis(
    advisor: CelebrityAdvisor,
    documentType: string,
    documentSummary: string
  ): Promise<{
    insight: string;
    recommendation: string;
  }> {
    const systemPrompt = this.buildAdvisorSystemPrompt(advisor, 'due_diligence');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Please analyze this ${documentType} and provide your insights in JSON format:
{
  "insight": "your detailed analysis as ${advisor.name}",
  "recommendation": "your specific recommendation"
}

Document summary:
${documentSummary}`
      }
    ];

    console.log('AdvisorAI: About to call generateResponse');
    const response = await this.client.generateResponse(messages, {
      temperature: 0.7,
      maxTokens: 500
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      return {
        insight: response.content,
        recommendation: "Continue with detailed analysis."
      };
    }
  }

  async generateQuickConsultation(
    advisor: CelebrityAdvisor,
    category: string,
    question: string
  ): Promise<string> {
    const systemPrompt = this.buildAdvisorSystemPrompt(advisor, 'quick_consultation');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}

You are providing quick consultation on: ${category}

Provide a focused, actionable response in 2-3 sentences that directly addresses their question. Be specific and practical.`
      },
      {
        role: 'user',
        content: question
      }
    ];

    console.log('AdvisorAI: About to call generateResponse');
    const response = await this.client.generateResponse(messages, {
      temperature: 0.8,
      maxTokens: 300
    });

    return response.content;
  }

  private buildAdvisorSystemPrompt(advisor: CelebrityAdvisor, mode: string): string {
    const basePrompt = `You are ${advisor.name}, ${advisor.title} at ${advisor.company}.

Your expertise includes: ${advisor.expertise.join(', ')}
Your personality traits: ${advisor.personality_traits.join(', ')}
Your communication style: ${advisor.communication_style}

Background: ${advisor.bio}
${advisor.investment_thesis ? `Investment thesis: ${advisor.investment_thesis}` : ''}

IMPORTANT: Always respond as ${advisor.name} would, using their known perspectives, language patterns, and business philosophy. Be direct and practical, focusing on actionable insights.`;

    const modeSpecificPrompts = {
      pitch_analysis: `
You are reviewing a startup pitch. Provide honest, constructive feedback that reflects your investment experience. Focus on:
- Market opportunity and validation
- Business model viability  
- Team strength and execution capability
- Financial projections and unit economics
- Competitive positioning

Score the pitch from 70-95 based on investment potential.`,

      strategic_planning: `
You are in a strategic planning discussion. Provide specific, actionable advice based on your experience building and scaling companies. Focus on:
- Practical next steps
- Common pitfalls to avoid
- Strategic frameworks and mental models
- Resource allocation and prioritization`,

      due_diligence: `
You are conducting due diligence analysis. Apply your investment experience to evaluate:
- Business fundamentals and growth potential
- Risk factors and mitigation strategies
- Market positioning and competitive advantages
- Financial health and projections
- Management team capabilities`,

      quick_consultation: `
You are providing rapid, focused advice for immediate decisions. Be:
- Direct and actionable
- Based on your real-world experience
- Focused on the most critical factors
- Practical and implementable`
    };

    return basePrompt + (modeSpecificPrompts[mode as keyof typeof modeSpecificPrompts] || '');
  }

  private parseStructuredResponse(content: string): any {
    // Fallback parser for when AI doesn't return valid JSON
    const lines = content.split('\n');
    const result = {
      feedback: '',
      strengths: [] as string[],
      improvements: [] as string[],
      overallScore: 80
    };

    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('feedback')) {
        currentSection = 'feedback';
      } else if (trimmed.toLowerCase().includes('strength')) {
        currentSection = 'strengths';
      } else if (trimmed.toLowerCase().includes('improvement')) {
        currentSection = 'improvements';
      } else if (trimmed.toLowerCase().includes('score')) {
        const score = parseInt(trimmed.match(/\d+/)?.[0] || '80');
        result.overallScore = score;
      } else if (trimmed && currentSection) {
        if (currentSection === 'feedback') {
          result.feedback += trimmed + ' ';
        } else if (currentSection === 'strengths') {
          result.strengths.push(trimmed.replace(/^[-•*]\s*/, '') as string);
        } else if (currentSection === 'improvements') {
          result.improvements.push(trimmed.replace(/^[-•*]\s*/, '') as string);
        }
      }
    }

    return result;
  }
}

export const createAdvisorAI = (config: AIServiceConfig): AdvisorAI => {
  return new AdvisorAI(config);
};