/**
 * Multi-Provider AI Service
 * Supports OpenAI, Anthropic Claude, Google Gemini, and DeepSeek
 * Users can configure which provider to use for each AI persona
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'deepseek';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string; // Optional user-provided key
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

export class MultiProviderAI {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize with environment variables (fallback)
    const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const anthropicKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
    }

    if (anthropicKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true });
    }
  }

  /**
   * Generate AI response using the specified provider
   */
  async generate(
    messages: AIMessage[],
    config: AIProviderConfig
  ): Promise<AIResponse> {
    const { provider, model, apiKey } = config;

    switch (provider) {
      case 'anthropic':
        return this.generateAnthropic(messages, model, apiKey);
      case 'openai':
        return this.generateOpenAI(messages, model, apiKey);
      case 'gemini':
        return this.generateGemini(messages, model, apiKey);
      case 'deepseek':
        return this.generateDeepSeek(messages, model, apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Anthropic Claude
   */
  private async generateAnthropic(
    messages: AIMessage[],
    model: string,
    apiKey?: string
  ): Promise<AIResponse> {
    const client = apiKey
      ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
      : this.anthropicClient;

    if (!client) {
      throw new Error('Anthropic API key not configured');
    }

    // Separate system messages from conversation
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await client.messages.create({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemMessages.map(m => m.content).join('\n\n'),
      messages: conversationMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content,
      provider: 'anthropic',
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  /**
   * OpenAI GPT
   */
  private async generateOpenAI(
    messages: AIMessage[],
    model: string,
    apiKey?: string
  ): Promise<AIResponse> {
    const client = apiKey
      ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
      : this.openaiClient;

    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await client.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      provider: 'openai',
      model: response.model,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  /**
   * Google Gemini
   */
  private async generateGemini(
    messages: AIMessage[],
    model: string,
    apiKey?: string
  ): Promise<AIResponse> {
    const key = apiKey || process.env.REACT_APP_GEMINI_API_KEY;

    if (!key) {
      throw new Error('Gemini API key not configured');
    }

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash-exp'}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content,
      provider: 'gemini',
      model: model || 'gemini-2.0-flash-exp',
      tokensUsed: data.usageMetadata?.totalTokenCount,
    };
  }

  /**
   * DeepSeek
   */
  private async generateDeepSeek(
    messages: AIMessage[],
    model: string,
    apiKey?: string
  ): Promise<AIResponse> {
    const key = apiKey || process.env.REACT_APP_DEEPSEEK_API_KEY;

    if (!key) {
      throw new Error('DeepSeek API key not configured');
    }

    // DeepSeek uses OpenAI-compatible API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      provider: 'deepseek',
      model: data.model,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider): string[] {
    switch (provider) {
      case 'anthropic':
        return [
          'claude-sonnet-4-20250514',
          'claude-opus-4-20250514',
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
        ];
      case 'openai':
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      case 'gemini':
        return ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
      case 'deepseek':
        return ['deepseek-chat', 'deepseek-coder'];
      default:
        return [];
    }
  }

  /**
   * Get default model for a provider
   */
  getDefaultModel(provider: AIProvider): string {
    switch (provider) {
      case 'anthropic':
        return 'claude-sonnet-4-20250514';
      case 'openai':
        return 'gpt-4o';
      case 'gemini':
        return 'gemini-2.0-flash-exp';
      case 'deepseek':
        return 'deepseek-chat';
      default:
        return '';
    }
  }

  /**
   * Validate API key for a provider
   */
  async validateApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
    try {
      const testMessage: AIMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      await this.generate(testMessage, {
        provider,
        model: this.getDefaultModel(provider),
        apiKey,
      });

      return true;
    } catch (error) {
      console.error(`API key validation failed for ${provider}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const multiProviderAI = new MultiProviderAI();
