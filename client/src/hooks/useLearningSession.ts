import { useCallback, useRef, useState } from 'react';
import {
  generatePracticeQuestion,
  streamExplanation,
  submitPracticeAttempt,
  type PracticeAttemptResult,
  type PracticeQuestion,
  checkTeachingAnswer,
  type TeachingEvaluationResult,
  type TeachingStep,
} from '@/lib/api/ai';

type SessionStage = 'input' | 'teaching' | 'checking' | 'feedback' | 'practice' | 'result';
type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LearningSession {
  question: string;
  subject: string;
  grade: string;
  explanationMode: 'step-by-step' | 'direct' | null;
  explanation: string;
  lesson: TeachingStep[];
  currentTeachingStep: number;
  learnerAnswer: string;
  feedback: string;
  teachingEvaluation: TeachingEvaluationResult | null;
  teachingAttempt: number;
  practiceQuestion: PracticeQuestion | null;
  selectedAnswer: number | null;
  correctness: boolean | null;
  stage: SessionStage;
}

const emptySession: LearningSession = {
  question: '',
  subject: '',
  grade: '',
  explanationMode: null,
  explanation: '',
  lesson: [],
  currentTeachingStep: 0,
  learnerAnswer: '',
  feedback: '',
  teachingEvaluation: null,
  teachingAttempt: 0,
  practiceQuestion: null,
  selectedAnswer: null,
  correctness: null,
  stage: 'input',
};

export function useLearningSession() {
  const [session, setSession] = useState<LearningSession>(emptySession);
  const [explanationStatus, setExplanationStatus] = useState<OperationStatus>('idle');
  const [practiceStatus, setPracticeStatus] = useState<OperationStatus>('idle');
  const [answerStatus, setAnswerStatus] = useState<OperationStatus>('idle');
  const [teachingCheckStatus, setTeachingCheckStatus] = useState<OperationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const practiceInFlight = useRef(false);
  const answerInFlight = useRef(false);

  const startSession = useCallback((question: string, subject: string, grade: string) => {
    setSession({ ...emptySession, question: question.trim(), subject, grade, stage: 'explanation' });
    setExplanationStatus('idle');
    setPracticeStatus('idle');
    setAnswerStatus('idle');
    setError(null);
  }, []);

  const requestExplanation = useCallback(async (mode: 'step-by-step' | 'direct', language: string) => {
    if (!session.question) return;
    setSession((current) => ({ ...current, explanationMode: mode, explanation: '', practiceQuestion: null, selectedAnswer: null, correctness: null, teachingEvaluation: null, teachingAttempt: 0, stage: 'explanation' }));
    setExplanationStatus('loading');
    setPracticeStatus('idle');
    setAnswerStatus('idle');
    setError(null);

    await streamExplanation({
      question: session.question,
      subject: session.subject,
      grade: session.grade,
      language,
      mode,
      onDelta: (text) => setSession((current) => ({ ...current, explanation: current.explanation + text })),
      onLesson: (lesson) => setSession((current) => ({ ...current, lesson, stage: 'teaching' })),
      onDone: () => setExplanationStatus('success'),
      onError: (message) => {
        setExplanationStatus('error');
        setError(message);
      },
    });
  }, [session]);

  const submitTeachingAnswer = useCallback(async (learnerAnswer: string, language: string) => {
    const step = session.lesson[session.currentTeachingStep];
    if (!step || teachingCheckStatus === 'loading' || teachingCheckStatus === 'success') return;
    setSession((current) => ({ ...current, learnerAnswer, stage: 'checking' }));
    setTeachingCheckStatus('loading');
    setError(null);
    try {
      const result = await checkTeachingAnswer({
        question: session.question,
        subject: session.subject,
        grade: session.grade,
        language,
        stepNumber: step.stepNumber,
        checkQuestion: step.checkQuestion,
        expectedAnswer: step.expectedAnswer,
        learnerAnswer,
        attemptNumber: session.teachingAttempt + 1,
      });
      setSession((current) => ({ ...current, teachingEvaluation: result, feedback: result.feedback, teachingAttempt: current.teachingAttempt + 1, stage: 'feedback' }));
      setTeachingCheckStatus('success');
    } catch (requestError) {
      setTeachingCheckStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'Unable to evaluate your answer.');
    }
  }, [session, teachingCheckStatus]);

  const setLearnerAnswer = useCallback((learnerAnswer: string) => {
    setSession((current) => ({ ...current, learnerAnswer }));
  }, []);

  const nextTeachingStep = useCallback(() => {
    if (session.teachingEvaluation?.status !== 'correct') return;
    if (session.currentTeachingStep >= session.lesson.length - 1) {
      setSession((current) => ({ ...current, stage: 'practice' }));
      return;
    }
    setSession((current) => ({ ...current, currentTeachingStep: current.currentTeachingStep + 1, learnerAnswer: '', feedback: '', teachingEvaluation: null, teachingAttempt: 0, correctness: null, stage: 'teaching' }));
    setTeachingCheckStatus('idle');
  }, [session]);

  const retryTeachingAnswer = useCallback(() => {
    setSession((current) => ({ ...current, learnerAnswer: '', feedback: '', teachingEvaluation: null, stage: 'teaching' }));
    setTeachingCheckStatus('idle');
    setError(null);
  }, []);

  const requestPractice = useCallback(async (language: string) => {
    if (!session.question || !session.explanationMode || !session.explanation) return;
    if (practiceStatus === 'loading' || session.practiceQuestion || practiceInFlight.current) return;
    practiceInFlight.current = true;
    setPracticeStatus('loading');
    setError(null);
    try {
      const practiceQuestion = await generatePracticeQuestion({
        topic: session.question,
        subject: session.subject,
        grade: session.grade,
        difficulty: 'easy',
        language,
        mode: session.explanationMode,
      });
      setSession((current) => ({ ...current, practiceQuestion, stage: 'practice' }));
      setPracticeStatus('success');
    } catch (requestError) {
      setPracticeStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'Unable to prepare a practice question.');
    } finally {
      practiceInFlight.current = false;
    }
  }, [session, practiceStatus]);

  const submitAnswer = useCallback(async (index: number) => {
    if (!session.practiceQuestion || answerStatus === 'loading' || session.correctness !== null || answerInFlight.current) return;
    const selectedAnswer = session.practiceQuestion.options[index];
    if (!selectedAnswer) return;
    setSession((current) => ({ ...current, selectedAnswer: index }));
    setAnswerStatus('loading');
    answerInFlight.current = true;
    setError(null);
    try {
      const result: PracticeAttemptResult = await submitPracticeAttempt({
        question: session.question,
        subject: session.subject,
        grade: session.grade,
        selectedAnswer,
      });
      setSession((current) => ({ ...current, correctness: result.correct, stage: 'result' }));
      setAnswerStatus('success');
    } catch (requestError) {
      setAnswerStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit your answer.');
    }
    finally {
      answerInFlight.current = false;
    }
  }, [session, answerStatus]);

  const resetSession = useCallback(() => {
    setSession(emptySession);
    setExplanationStatus('idle');
    setPracticeStatus('idle');
    setAnswerStatus('idle');
    setError(null);
  }, []);

  return {
    session,
    explanationStatus,
    practiceStatus,
    answerStatus,
    teachingCheckStatus,
    error,
    startSession,
    requestExplanation,
    requestPractice,
    submitAnswer,
    submitTeachingAnswer,
    setLearnerAnswer,
    nextTeachingStep,
    retryTeachingAnswer,
    resetSession,
  };
}
