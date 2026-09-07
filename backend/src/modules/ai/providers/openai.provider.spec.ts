import { ConfigService } from '@nestjs/config';

import { AIProviderError } from '../ai.types';
import { OpenAIProvider } from './openai.provider';

const request = {
  model: 'gpt-4o-mini',
  messages: [{ role: 'user' as const, content: 'Provide a review-required draft.' }],
};

describe('OpenAIProvider', () => {
  const config = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockImplementation((key: string) => {
      if (key === 'ai.provider') return 'openai';
      if (key === 'ai.apiKey') return 'test-key';
      return undefined;
    });
    config.getOrThrow.mockImplementation((key: string) => {
      const values: Record<string, string | number> = {
        'ai.model': 'gpt-4o-mini',
        'ai.baseUrl': 'https://ai.example/v1',
        'ai.timeoutMs': 10,
        'ai.maxRetries': 0,
      };
      return values[key];
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('parses a valid provider response and tracks token use', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'gpt-4o-mini',
          choices: [{ message: { content: '  Draft for clinician review. ' } }],
          usage: { prompt_tokens: 8, completion_tokens: 5, total_tokens: 13 },
        }),
        { status: 200 },
      ),
    );
    const provider = new OpenAIProvider(config as unknown as ConfigService);

    await expect(provider.generate(request)).resolves.toEqual({
      content: 'Draft for clinician review.',
      model: 'gpt-4o-mini',
      usage: { inputTokens: 8, outputTokens: 5, totalTokens: 13 },
    });
    expect(provider.defaultModel).toBe('gpt-4o-mini');
  });

  it('maps a timeout to an unavailable provider error', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new DOMException('Request aborted', 'AbortError'));
    const provider = new OpenAIProvider(config as unknown as ConfigService);

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AIProviderError>>({
      code: 'AI_UNAVAILABLE',
    });
  });

  it('rejects a malformed success response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ choices: [] })));
    const provider = new OpenAIProvider(config as unknown as ConfigService);

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AIProviderError>>({
      code: 'AI_INVALID_RESPONSE',
    });
  });
});
