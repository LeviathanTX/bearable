// Secure AI Service Implementation
// Removes client-side API key exposure and implements proper security patterns

import { AIServiceConfig } from '../types';
import { environment } from '../config/environment';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata?: {
    model: string;
    service: string;
    timestamp: string;
  };
}

export interface AIServiceOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Secure AI Service Client
 * - No client-side API key exposure
 * - Environment-based configuration
 * - Proper error handling and fallbacks
 * - Request/response validation
 */
export class SecureAIServiceClient {
  private readonly config: AIServiceConfig;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: AIServiceConfig) {
    this.config = {
      ...config,
      apiKey: '', // Never store API keys on client
    };
    this.baseUrl = environment.getApiBaseUrl();
    this.timeout = 30000; // 30 seconds default timeout
  }

  async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    const timestamp = new Date().toISOString();

    if (environment.isDebugMode()) {
      console.log(`🔍 [${timestamp}] Secure AI Service Call`, {
        service: this.config.id,
        messageCount: messages.length,
        options,
        useMock: environment.shouldUseMockAI()
      });
    }

    // Validate input
    const validationError = this.validateRequest(messages, options);
    if (validationError) {
      throw new Error(`Invalid request: ${validationError}`);
    }

    // Use mock responses in development or when configured
    if (environment.shouldUseMockAI()) {
      return this.generateSecureMockResponse(messages, options);
    }

    // Make secure API call through backend proxy
    return this.makeSecureAPICall(messages, options);
  }

  private validateRequest(messages: AIMessage[], options: AIServiceOptions): string | null {
    if (!messages || messages.length === 0) {
      return 'Messages array cannot be empty';
    }

    if (messages.some(msg => !msg.content || msg.content.trim().length === 0)) {
      return 'All messages must have non-empty content';
    }

    if (options.maxTokens && (options.maxTokens < 1 || options.maxTokens > 4000)) {
      return 'maxTokens must be between 1 and 4000';
    }

    if (options.temperature && (options.temperature < 0 || options.temperature > 2)) {
      return 'temperature must be between 0 and 2';
    }

    return null;
  }

  private async makeSecureAPICall(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const requestPayload = {
      service: this.config.id,
      model: this.config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: this.sanitizeContent(msg.content)
      })),
      options: {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2000,
        timeout: options.timeout ?? this.timeout
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': this.generateRequestId(),
          'X-Client-Version': '1.0.0'
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API Error ${response.status}: ${error.message || 'Request failed'}`);
      }

      const data = await response.json();
      return this.validateAndSanitizeResponse(data);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error - please check your connection');
        }
      }

      console.error('Secure AI API call failed:', error);
      throw error;
    }
  }

  private async generateSecureMockResponse(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    // Simulate realistic API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    const lastMessage = messages[messages.length - 1]?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';

    // Generate contextual mock response
    const content = this.generateContextualMockContent(lastMessage, systemMessage);

    return {
      content,
      usage: {
        prompt_tokens: Math.floor(lastMessage.length / 4) + 50,
        completion_tokens: Math.floor(content.length / 4) + 25,
        total_tokens: Math.floor((lastMessage.length + content.length) / 4) + 75
      },
      metadata: {
        model: this.config.model || 'mock-model',
        service: this.config.id,
        timestamp: new Date().toISOString()
      }
    };
  }

  private generateContextualMockContent(userMessage: string, systemMessage: string): string {
    // Extract advisor context from system message
    const advisorMatch = systemMessage.match(/You are ([^,\n]+)/i);
    const advisorName = advisorMatch?.[1] || 'AI Advisor';

    // Generate professional, contextual responses
    const responses = this.getAdvisorResponses(advisorName, userMessage);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getAdvisorResponses(advisorName: string, userMessage: string): string[] {
    const messageType = this.categorizeMessage(userMessage);

    const responseTemplates: Record<string, string[]> = {
      financial: [
        `Based on my analysis of the financial data, I see several key areas that require attention. The revenue trajectory shows promise, but we need to examine the underlying unit economics more closely.`,
        `From a financial perspective, the fundamentals appear solid, though I'd recommend stress-testing the projections against various market scenarios to ensure robustness.`,
        `The financial metrics indicate strong potential, but sustainable growth will depend on maintaining healthy cash flow management and optimizing the capital structure.`
      ],
      strategic: [
        `This presents an interesting strategic opportunity. The key will be executing on the core value proposition while building defensible competitive moats.`,
        `From a strategic standpoint, I see significant potential if we can address the market positioning challenges and strengthen the go-to-market approach.`,
        `The strategic landscape is complex here. Success will require careful navigation of competitive dynamics and clear prioritization of growth initiatives.`
      ],
      risk: [
        `I've identified several risk factors that warrant careful consideration. The most critical areas involve market timing and execution capability.`,
        `The risk profile shows both upside potential and downside protection concerns. We'll need to implement robust mitigation strategies for the key vulnerabilities.`,
        `Risk assessment reveals manageable exposure levels, though continuous monitoring will be essential as market conditions evolve.`
      ],
      general: [
        `This is a compelling opportunity that aligns well with current market trends. The execution strategy will be critical for realizing the full potential.`,
        `I see strong fundamentals here, though success will depend on the team's ability to navigate the competitive landscape and scale effectively.`,
        `The opportunity merits serious consideration. With proper execution and strategic positioning, this could deliver significant value.`
      ]
    };

    return responseTemplates[messageType] || responseTemplates.general;
  }

  private categorizeMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('financial') || lowerMessage.includes('revenue') ||
        lowerMessage.includes('profit') || lowerMessage.includes('cash')) {
      return 'financial';
    }

    if (lowerMessage.includes('strategy') || lowerMessage.includes('market') ||
        lowerMessage.includes('competitive') || lowerMessage.includes('growth')) {
      return 'strategic';
    }

    if (lowerMessage.includes('risk') || lowerMessage.includes('concern') ||
        lowerMessage.includes('threat') || lowerMessage.includes('challenge')) {
      return 'risk';
    }

    return 'general';
  }

  private sanitizeContent(content: string): string {
    // Remove potentially harmful content
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 10000); // Limit content length
  }

  private validateAndSanitizeResponse(data: any): AIResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    if (!data.content || typeof data.content !== 'string') {
      throw new Error('Response missing valid content');
    }

    return {
      content: this.sanitizeContent(data.content),
      usage: data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      metadata: {
        model: data.model || this.config.model || 'unknown',
        service: this.config.id,
        timestamp: new Date().toISOString()
      }
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function for creating secure AI clients
 */
export function createSecureAIClient(config: AIServiceConfig): SecureAIServiceClient {
  return new SecureAIServiceClient(config);
}

/**
 * Service registry for managing multiple AI services securely
 */
export class SecureAIServiceRegistry {
  private static instance: SecureAIServiceRegistry;
  private clients = new Map<string, SecureAIServiceClient>();

  static getInstance(): SecureAIServiceRegistry {
    if (!SecureAIServiceRegistry.instance) {
      SecureAIServiceRegistry.instance = new SecureAIServiceRegistry();
    }
    return SecureAIServiceRegistry.instance;
  }

  registerService(config: AIServiceConfig): void {
    this.clients.set(config.id, createSecureAIClient(config));
  }

  getService(serviceId: string): SecureAIServiceClient | undefined {
    return this.clients.get(serviceId);
  }

  listServices(): string[] {
    return Array.from(this.clients.keys());
  }

  clear(): void {
    this.clients.clear();
  }
}