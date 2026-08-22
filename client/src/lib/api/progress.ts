import { apiFetch } from '@/lib/api';

export interface ProgressSummary {
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

export function getProgressSummary(): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>('/progress');
}

export function getLearningHistory(): Promise<LearningHistoryItem[]> {
  return apiFetch<LearningHistoryItem[]>('/progress/history');
}
