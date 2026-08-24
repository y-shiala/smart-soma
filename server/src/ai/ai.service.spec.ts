import { ServiceUnavailableException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { AiConfig } from './ai.config.js';
import { AiService } from './ai.service.js';
import type { AiProvider } from './interfaces/ai-provider.interface.js';

describe('AiService', () => {
  const provider: AiProvider = {
    explain: jest.fn(),
    createPracticeQuestion: jest.fn(),
    evaluateTeachingAnswer: jest.fn(),
  };

  it('delegates to the configured provider', async () => {
    const service = new AiService(
      { provider: 'gemini', model: 'configured-model', geminiApiKey: 'key' } as AiConfig,
      provider,
    );
    const request = { question: 'Q', subject: 'math', grade: 'lower-primary', language: 'en', mode: 'direct' };
    await service.explain(request);
    await service.createPracticeQuestion(request);
    expect(provider.explain).toHaveBeenCalledWith(request);
    expect(provider.createPracticeQuestion).toHaveBeenCalledWith(request);
  });

  it('rejects an unsupported configured provider', async () => {
    const service = new AiService(
      { provider: 'unsupported', model: 'configured-model', geminiApiKey: 'key' } as AiConfig,
      provider,
    );
    await expect(service.explain({} as never)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
