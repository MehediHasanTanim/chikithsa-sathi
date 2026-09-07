import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  type AIProvider,
  AIProviderError,
  type AIRequestPayload,
  type AIResponse,
} from '../ai.types';

type OpenAIChatResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: ConfigService) {
    this.name = 'openai';
    this.defaultModel = config.getOrThrow<string>('ai.model');
    this.apiKey = config.get<string>('ai.apiKey');
    this.baseUrl = config.getOrThrow<string>('ai.baseUrl').replace(/\/$/, '');
    this.timeoutMs = config.getOrThrow<number>('ai.timeoutMs');
    this.maxRetries = config.getOrThrow<number>('ai.maxRetries');
  }

  async generate(request: AIRequestPayload): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new AIProviderError('AI_UNAVAILABLE', 'AI provider is not configured');
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        return await this.request(request);
      } catch (error) {
        if (error instanceof AIProviderError && error.code === 'AI_INVALID_RESPONSE') throw error;
        if (attempt === this.maxRetries) {
          if (error instanceof AIProviderError) throw error;
          throw new AIProviderError('AI_UNAVAILABLE', 'AI provider request failed');
        }
      }
    }

    throw new AIProviderError('AI_UNAVAILABLE', 'AI provider request failed');
  }

  private async request(request: AIRequestPayload): Promise<AIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxOutputTokens ?? 1000,
        }),
      });
      if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new AIProviderError('AI_INVALID_RESPONSE', 'AI provider rejected the request');
        }
        throw new AIProviderError('AI_UNAVAILABLE', 'AI provider is temporarily unavailable');
      }
      const body = (await response.json()) as OpenAIChatResponse;
      const content = body.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new AIProviderError('AI_INVALID_RESPONSE', 'AI provider returned no usable content');
      }
      return {
        content,
        model: body.model ?? request.model,
        usage: {
          inputTokens: body.usage?.prompt_tokens,
          outputTokens: body.usage?.completion_tokens,
          totalTokens: body.usage?.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AIProviderError('AI_UNAVAILABLE', 'AI provider request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
