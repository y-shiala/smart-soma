import { Injectable } from '@nestjs/common';
import { Grade } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProgressDto } from './dto/create-progress.dto.js';

const gradeMap: Record<string, Grade> = {
  'lower-primary': Grade.lower_primary,
  'upper-primary': Grade.upper_primary,
  'junior-high': Grade.junior_high,
  'senior-high': Grade.senior_high,
};

const apiGradeMap: Record<Grade, string> = {
  [Grade.lower_primary]: 'lower-primary',
  [Grade.upper_primary]: 'upper-primary',
  [Grade.junior_high]: 'junior-high',
  [Grade.senior_high]: 'senior-high',
};

export interface ProgressStats {
  questionsAnswered: number;
  streak: number;
  todayProgress: number;
  todayGoal: number;
  totalLearningActivities: number;
  totalPracticeAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracyPercentage: number;
  questionsPracticed: string[];
}

export interface LearningHistoryItem {
  id: string;
  type: 'explanation' | 'practice-attempt';
  question: string;
  subject: string | null;
  grade: string | null;
  selectedAnswer?: string;
  correct?: boolean;
  timestamp: string;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string): Promise<ProgressStats> {
    const [totalCount, todayCount, recentActivity, attemptCount, correctCount, questions] = await Promise.all([
      this.prisma.userProgress.count({ where: { userId } }),
      this.prisma.userProgress.count({
        where: {
          userId,
          answeredAt: { gte: startOfToday() },
        },
      }),
      this.prisma.userProgress.findMany({
        where: { userId },
        select: { answeredAt: true },
        orderBy: { answeredAt: 'desc' },
        take: 100,
      }),
      this.prisma.learningAttempt.count({ where: { userId } }),
      this.prisma.learningAttempt.count({ where: { userId, correct: true } }),
      this.prisma.learningAttempt.findMany({
        where: { userId },
        select: { question: true },
        distinct: ['question'],
        orderBy: { answeredAt: 'desc' },
        take: 100,
      }),
    ]);

    const streak = calculateStreak(recentActivity.map((entry) => entry.answeredAt));

    return {
      questionsAnswered: totalCount,
      streak,
      todayProgress: todayCount,
      todayGoal: 5,
      totalLearningActivities: totalCount,
      totalPracticeAttempts: attemptCount,
      correctAttempts: correctCount,
      incorrectAttempts: attemptCount - correctCount,
      accuracyPercentage: attemptCount === 0 ? 0 : Math.round((correctCount / attemptCount) * 100),
      questionsPracticed: questions.map((entry) => entry.question),
    };
  }

  async getHistory(userId: string): Promise<LearningHistoryItem[]> {
    const [progressEntries, attempts] = await Promise.all([
      this.prisma.userProgress.findMany({
        where: { userId },
        orderBy: { answeredAt: 'desc' },
        take: 100,
      }),
      this.prisma.learningAttempt.findMany({
        where: { userId },
        orderBy: { answeredAt: 'desc' },
        take: 100,
      }),
    ]);

    const matchedProgressIds = new Set<string>();
    for (const attempt of attempts) {
      const matchingProgress = progressEntries.find(
        (entry) =>
          !matchedProgressIds.has(entry.id) &&
          entry.question === attempt.question &&
          entry.subject === attempt.subject &&
          entry.grade === attempt.grade &&
          Math.abs(entry.answeredAt.getTime() - attempt.answeredAt.getTime()) <= 1000,
      );
      if (matchingProgress) matchedProgressIds.add(matchingProgress.id);
    }

    return [
      ...progressEntries
        .filter((entry) => !matchedProgressIds.has(entry.id))
        .map((entry) => ({
          id: entry.id,
          type: 'explanation' as const,
          question: entry.question,
          subject: entry.subject,
          grade: entry.grade ? apiGradeMap[entry.grade] : null,
          timestamp: entry.answeredAt.toISOString(),
        })),
      ...attempts.map((attempt) => ({
        id: attempt.id,
        type: 'practice-attempt' as const,
        question: attempt.question,
        subject: attempt.subject,
        grade: apiGradeMap[attempt.grade],
        selectedAnswer: attempt.selectedAnswer,
        correct: attempt.correct,
        timestamp: attempt.answeredAt.toISOString(),
      })),
    ].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }

  async createProgress(
    userId: string,
    dto: CreateProgressDto,
  ): Promise<{ question: string; subject?: string | null; grade?: string | null }> {
    const entry = await this.prisma.userProgress.create({
      data: {
        userId,
        question: dto.question.trim(),
        subject: dto.subject?.trim() || null,
        grade: dto.grade ? gradeMap[dto.grade] : null,
      },
    });

    return {
      question: entry.question,
      subject: entry.subject,
      grade: entry.grade ? apiGradeMap[entry.grade] : null,
    };
  }
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDays = new Set<string>();
  for (const date of dates) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    uniqueDays.add(normalized.toDateString());
  }

  const sortedDays = Array.from(uniqueDays)
    .map((day) => new Date(day))
    .sort((a, b) => b.getTime() - a.getTime());

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let index = 0; index < sortedDays.length; index += 1) {
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() - index);
    expectedDate.setHours(0, 0, 0, 0);

    const activityDate = new Date(sortedDays[index]);
    activityDate.setHours(0, 0, 0, 0);

    if (activityDate.getTime() === expectedDate.getTime()) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}