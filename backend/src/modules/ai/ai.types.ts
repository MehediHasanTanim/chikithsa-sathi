export type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIRequestPayload = {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  maxOutputTokens?: number;
};

export type AIUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AIResponse = {
  content: string;
  model: string;
  usage: AIUsage;
};

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  generate(request: AIRequestPayload): Promise<AIResponse>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export class AIProviderError extends Error {
  constructor(
    public readonly code: 'AI_UNAVAILABLE' | 'AI_INVALID_RESPONSE',
    message: string,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
