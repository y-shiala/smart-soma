import { Injectable } from '@nestjs/common';
import type { SafeUser } from '../auth/auth.service.js';
import { ExplainQuestionDto } from './dto/explain-question.dto.js';
import { PracticeQuestionDto } from './dto/practice-question.dto.js';
import { SubmitAttemptDto } from './dto/submit-attempt.dto.js';
import { Grade } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { CheckTeachingAnswerDto } from './dto/check-teaching-answer.dto.js';
import type { TeachingStep } from '../ai/interfaces/ai-provider.interface.js';

export interface ExplanationResponse {
  question: string;
  explanation: string;
  subject: string;
  grade: string;
  steps: TeachingStep[];
}

export interface PracticeQuestionResponse {
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  hint: string;
  explanation: string;
  subject: string;
  grade: string;
}

export interface AttemptResponse {
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
}

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) { }

  async generateExplanation(_user: SafeUser, dto: ExplainQuestionDto): Promise<ExplanationResponse> {
    const result = await this.aiService.explain(dto);
    return {
      question: dto.question.trim(),
      explanation: result.explanation,
      subject: dto.subject.trim(),
      grade: dto.grade,
      steps: result.steps,
    };
  }

  async checkTeachingAnswer(_user: SafeUser, dto: CheckTeachingAnswerDto) {
    return this.aiService.evaluateTeachingAnswer({
      question: dto.question,
      subject: dto.subject,
      grade: dto.grade,
      language: dto.language,
      step: {
        stepNumber: dto.stepNumber,
        concept: '',
        explanation: '',
        checkQuestion: dto.checkQuestion,
        expectedAnswer: dto.expectedAnswer,
      },
      learnerAnswer: dto.learnerAnswer,
      attemptNumber: dto.attemptNumber,
    });
  }

  async generatePracticeQuestion(
    _user: SafeUser,
    dto: PracticeQuestionDto,
  ): Promise<PracticeQuestionResponse> {
    const result = await this.aiService.createPracticeQuestion(dto);
    return { ...result, correctIndex: result.options.indexOf(result.correctAnswer), subject: dto.subject.trim(), grade: dto.grade };
  }

  async submitAttempt(
    user: SafeUser,
    dto: SubmitAttemptDto,
  ): Promise<AttemptResponse> {
    const practice = createPracticeQuestion(dto.question, dto.subject, dto.grade);
    const selectedAnswer = dto.selectedAnswer.trim();
    const correct = selectedAnswer === practice.correctAnswer;

    await this.prisma.$transaction([
      this.prisma.learningAttempt.create({
        data: {
          userId: user.id,
          question: dto.question.trim(),
          subject: dto.subject.trim(),
          grade: gradeMap[dto.grade],
          selectedAnswer,
          correct,
        },
      }),
      this.prisma.userProgress.create({
        data: {
          userId: user.id,
          question: dto.question.trim(),
          subject: dto.subject.trim(),
          grade: gradeMap[dto.grade],
        },
      }),
    ]);

    return {
      correct,
      selectedAnswer,
      correctAnswer: practice.correctAnswer,
      explanation: practice.explanation,
    };
  }
}

const gradeMap: Record<string, Grade> = {
  'lower-primary': Grade.lower_primary,
  'upper-primary': Grade.upper_primary,
  'junior-high': Grade.junior_high,
  'senior-high': Grade.senior_high,
};

function createPracticeQuestion(
  topic: string,
  subject: string,
  grade: string,
): PracticeQuestionResponse {
  const options = [
    'Read the question carefully and identify the goal.',
    'Skip the setup and guess the answer.',
    'Write the final answer without any reasoning.',
    'Change the values until the answer looks right.',
  ];

  return {
    question: `Which step is most important when solving: ${topic.trim()}?`,
    options,
    correctIndex: 0,
    correctAnswer: options[0],
    hint: 'Remember the steps you just learned! Think about what operation you need.',
    explanation: `For ${subject.trim()} in ${grade}, the best strategy is to understand the problem before solving it.`,
    subject: subject.trim(),
    grade,
  };
}
