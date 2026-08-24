import { Module } from '@nestjs/common';
import { AiConfig } from './ai.config.js';
import { AiService } from './ai.service.js';
import { AI_PROVIDER } from './interfaces/ai-provider.interface.js';
import { GeminiProvider } from './providers/gemini.provider.js';

@Module({
  providers: [
    AiConfig,
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      inject: [GeminiProvider],
      useFactory: (geminiProvider: GeminiProvider) => geminiProvider,
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule { }
