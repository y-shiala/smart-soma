import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiConfig } from './ai.config.js';
import {
  AI_PROVIDER,
  type AiProvider,
  ExplanationOutput,
  ExplanationRequest,
  PracticeQuestionOutput,
  PracticeQuestionRequest,
  TeachingEvaluationOutput,
  TeachingEvaluationRequest,
} from './interfaces/ai-provider.interface.js';

@Injectable()
export class AiService {
  constructor(
    private readonly config: AiConfig,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) { }

  async explain(request: ExplanationRequest): Promise<ExplanationOutput> {
    this.ensureProvider();
    return this.provider.explain(request);
  }

  async createPracticeQuestion(request: PracticeQuestionRequest): Promise<PracticeQuestionOutput> {
    this.ensureProvider();
    return this.provider.createPracticeQuestion(request);
  }

  async evaluateTeachingAnswer(request: TeachingEvaluationRequest): Promise<TeachingEvaluationOutput> {
    this.ensureProvider();
    return this.provider.evaluateTeachingAnswer(request);
  }

  private ensureProvider(): void {
    if (this.config.provider !== 'gemini') {
      throw new ServiceUnavailableException(`Unsupported AI provider: ${this.config.provider}`);
    }
  }
}
