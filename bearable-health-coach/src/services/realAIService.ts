// Real AI Service Integration for BearAble Health Coach
// Supports multiple AI providers with user API keys

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIServiceConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  apiKey: string;
  model?: string;
  baseUrl?: string;
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

export class RealAIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    const {
      temperature = 0.7,
      maxTokens = 1000,
      timeout = 30000
    } = options;

    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(messages, { temperature, maxTokens, timeout });
        case 'anthropic':
          return await this.callAnthropic(messages, { temperature, maxTokens, timeout });
        case 'google':
          return await this.callGoogle(messages, { temperature, maxTokens, timeout });
        case 'azure':
          return await this.callAzureOpenAI(messages, { temperature, maxTokens, timeout });
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  private async callOpenAI(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      metadata: {
        model: data.model,
        service: 'openai',
        timestamp: new Date().toISOString()
      }
    };
  }

  private async callAnthropic(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemMessage,
        messages: conversationMessages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API Error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      usage: data.usage,
      metadata: {
        model: data.model,
        service: 'anthropic',
        timestamp: new Date().toISOString()
      }
    };
  }

  private async callGoogle(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    // Google Gemini API implementation
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || 'gemini-pro'}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API Error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: data.candidates[0].content.parts[0].text,
      metadata: {
        model: this.config.model || 'gemini-pro',
        service: 'google',
        timestamp: new Date().toISOString()
      }
    };
  }

  private async callAzureOpenAI(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://your-resource.openai.azure.com';
    const response = await fetch(`${baseUrl}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-12-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API Error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      metadata: {
        model: data.model,
        service: 'azure',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// AI Service Manager to handle multiple configurations
export class AIServiceManager {
  private services: Map<string, RealAIService> = new Map();
  private defaultService: string | null = null;

  addService(config: AIServiceConfig): void {
    const service = new RealAIService(config);
    this.services.set(config.id, service);

    // Set as default if it's the first service
    if (!this.defaultService) {
      this.defaultService = config.id;
    }
  }

  setDefaultService(serviceId: string): void {
    if (this.services.has(serviceId)) {
      this.defaultService = serviceId;
    } else {
      throw new Error(`Service ${serviceId} not found`);
    }
  }

  async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {},
    serviceId?: string
  ): Promise<AIResponse> {
    const targetServiceId = serviceId || this.defaultService;

    if (!targetServiceId) {
      throw new Error('No AI service configured');
    }

    const service = this.services.get(targetServiceId);
    if (!service) {
      throw new Error(`Service ${targetServiceId} not found`);
    }

    return await service.generateResponse(messages, options);
  }

  getAvailableServices(): string[] {
    return Array.from(this.services.keys());
  }

  removeService(serviceId: string): void {
    this.services.delete(serviceId);
    if (this.defaultService === serviceId) {
      this.defaultService = this.services.size > 0 ? this.services.keys().next().value : null;
    }
  }
}

// Global instance
export const aiServiceManager = new AIServiceManager();