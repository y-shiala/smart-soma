import { apiFetch } from '@/lib/api';

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  hint: string;
  explanation: string;
}

export interface PracticeAttemptResult {
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface TeachingStep {
  stepNumber: number;
  concept: string;
  explanation: string;
  checkQuestion: string;
  expectedAnswer: string;
  hint?: string;
}

export interface TeachingEvaluationResult {
  status: 'correct' | 'partial' | 'incorrect' | 'wrong_method' | 'unclear';
  reasoningAssessment: string;
  feedback: string;
  nextAction: 'continue' | 'retry' | 'hint';
  hint: string;
}

export async function streamExplanation({
  question,
  subject,
  grade,
  language,
  mode,
  onDelta,
  onDone,
  onError,
  onLesson,
}: {
  question: string;
  subject: string;
  grade: string;
  language: string;
  mode: 'step-by-step' | 'direct';
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onLesson?: (steps: TeachingStep[]) => void;
}) {
  try {
    const data = await apiFetch<{ explanation: string; steps: TeachingStep[] }>('/learning/explanation', {
      method: 'POST',
      body: JSON.stringify({ question, subject, grade, language, mode }),
    });
    onLesson?.(data.steps);

    const chunks = data.explanation.split(/(\s+)/);
    for (const chunk of chunks) {
      onDelta(chunk);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    onDone();
    return data.explanation;
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unable to generate an explanation.');
    return '';
  }
}

export function checkTeachingAnswer(payload: {
  question: string;
  subject: string;
  grade: string;
  language: string;
  stepNumber: number;
  checkQuestion: string;
  expectedAnswer: string;
  learnerAnswer: string;
  attemptNumber: number;
}): Promise<TeachingEvaluationResult> {
  return apiFetch<TeachingEvaluationResult>('/learning/teaching-check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generatePracticeQuestion({
  topic,
  subject,
  grade,
  difficulty,
  language,
  mode,
}: {
  topic: string;
  subject: string;
  grade: string;
  difficulty: string;
  language: string;
  mode: 'step-by-step' | 'direct';
}): Promise<PracticeQuestion> {
  void difficulty;
  const data = await apiFetch<Omit<PracticeQuestion, 'correctIndex'>>('/learning/practice-question', {
    method: 'POST',
    body: JSON.stringify({ question: topic, subject, grade, language, mode }),
  });

  return { ...data, correctIndex: data.options.indexOf(data.correctAnswer) };
}

export function submitPracticeAttempt({
  question,
  subject,
  grade,
  selectedAnswer,
}: {
  question: string;
  subject: string;
  grade: string;
  selectedAnswer: string;
}): Promise<PracticeAttemptResult> {
  return apiFetch<PracticeAttemptResult>('/learning/attempts', {
    method: 'POST',
    body: JSON.stringify({ question, subject, grade, selectedAnswer }),
  });
}
