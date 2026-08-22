import { Injectable } from '@nestjs/common';
import type { SafeUser } from '../auth/auth.service.js';
import { ExplainQuestionDto } from './dto/explain-question.dto.js';
import { PracticeQuestionDto } from './dto/practice-question.dto.js';
import { SubmitAttemptDto } from './dto/submit-attempt.dto.js';
import { Grade } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ExplanationResponse {
  question: string;
  explanation: string;
  subject: string;
  grade: string;
}

export interface PracticeQuestionResponse {
  question: string;
  options: string[];
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
  constructor(private readonly prisma: PrismaService) {}

  generateExplanation(_user: SafeUser, dto: ExplainQuestionDto): ExplanationResponse {
    const explanation = [
      `Let's solve this step by step for ${dto.subject} in grade ${dto.grade}.`,
      '\n\nFirst, identify what the question is asking you to find.',
      '\n\nThen, use the relevant method or formula and work carefully through each step.',
      '\n\nFinally, check your answer to make sure it matches the question and units required.',
    ].join('');

    return {
      question: dto.question.trim(),
      explanation,
      subject: dto.subject.trim(),
      grade: dto.grade,
    };
  }

  generatePracticeQuestion(
    _user: SafeUser,
    dto: PracticeQuestionDto,
  ): PracticeQuestionResponse {
    return createPracticeQuestion(dto.question, dto.subject, dto.grade);
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
    correctAnswer: options[0],
    hint: 'Remember the steps you just learned! Think about what operation you need.',
    explanation: `For ${subject.trim()} in ${grade}, the best strategy is to understand the problem before solving it.`,
    subject: subject.trim(),
    grade,
  };
}
