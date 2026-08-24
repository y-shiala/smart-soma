import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfig {
  readonly provider = process.env.AI_PROVIDER ?? 'gemini';
  readonly model = process.env.AI_MODEL ?? '';
  readonly geminiApiKey = process.env.GEMINI_API_KEY ?? '';
}
