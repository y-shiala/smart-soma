export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface ExplanationRequest {
  question: string;
  subject: string;
  grade: string;
  language: string;
  mode: string;
}

export interface ExplanationOutput {
  explanation: string;
  steps: TeachingStep[];
}

export interface TeachingStep {
  stepNumber: number;
  concept: string;
  explanation: string;
  checkQuestion: string;
  expectedAnswer: string;
  hint?: string;
}

export interface TeachingEvaluationRequest {
  question: string;
  subject: string;
  grade: string;
  language: string;
  step: TeachingStep;
  learnerAnswer: string;
  attemptNumber: number;
}

export interface TeachingEvaluationOutput {
  status: 'correct' | 'partial' | 'incorrect' | 'wrong_method' | 'unclear';
  reasoningAssessment: string;
  feedback: string;
  nextAction: 'continue' | 'retry' | 'hint';
  hint: string;
}

export interface PracticeQuestionRequest {
  question: string;
  subject: string;
  grade: string;
  language: string;
  mode: string;
}

export interface PracticeQuestionOutput {
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
}

export interface AiProvider {
  explain(request: ExplanationRequest): Promise<ExplanationOutput>;
  evaluateTeachingAnswer(request: TeachingEvaluationRequest): Promise<TeachingEvaluationOutput>;
  createPracticeQuestion(request: PracticeQuestionRequest): Promise<PracticeQuestionOutput>;
}
