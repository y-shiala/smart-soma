import { ServiceUnavailableException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { AiConfig } from '../ai.config.js';
import { GeminiProvider } from './gemini.provider.js';

describe('GeminiProvider', () => {
  function createProvider(responseText: (string | Error) | Array<string | Error>, config: Partial<AiConfig> = {}) {
    const provider = new GeminiProvider({
      provider: 'gemini',
      model: 'configured-model',
      geminiApiKey: 'test-key',
      ...config,
    } as AiConfig);
    let responseIndex = 0;
    const responses = Array.isArray(responseText) ? responseText : [responseText];
    const generateContent = jest.fn(async () => {
      const currentResponse = responses[Math.min(responseIndex++, responses.length - 1)];
      if (currentResponse instanceof Error) throw currentResponse;
      return { text: currentResponse };
    });
    (provider as unknown as { client: unknown }).client = {
      models: { generateContent },
    };
    return { provider, generateContent };
  }

  const explanationRequest = {
    question: 'What is photosynthesis?',
    subject: 'science',
    grade: 'junior-high',
    language: 'en',
    mode: 'step-by-step',
  };

  function unavailableError() {
    return Object.assign(new Error('temporary Gemini outage'), { status: 503, code: 503 });
  }

  it('returns valid structured explanations and uses the configured model', async () => {
    const { provider, generateContent } = createProvider(
      JSON.stringify({
        explanation: 'Plants use light to make food.',
        steps: [{
          stepNumber: 1,
          concept: 'Light',
          explanation: 'Sunlight provides energy.',
          checkQuestion: 'What provides energy?',
          expectedAnswer: 'Sunlight',
        }],
      }),
    );

    await expect(provider.explain(explanationRequest)).resolves.toEqual(
      expect.objectContaining({ explanation: expect.any(String) }),
    );
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'configured-model' }),
    );
  });

  it('instructs step-by-step lessons not to reveal the final answer or batch completed steps', async () => {
    const { provider, generateContent } = createProvider(JSON.stringify({
      explanation: 'Addition combines quantities.',
      steps: [{
        stepNumber: 1,
        concept: 'Combining',
        explanation: 'Think about joining two groups.',
        checkQuestion: 'What does addition do?',
        expectedAnswer: 'It combines groups.',
      }],
    }));

    await provider.explain({
      question: 'What is 2 + 2?',
      subject: 'mathematics',
      grade: 'lower-primary',
      language: 'en',
      mode: 'step-by-step',
    });

    const prompt = generateContent.mock.calls[0][0].contents[0].parts[0].text;
    expect(prompt).toContain('do not reveal the final answer');
    expect(prompt).toContain('one concept at a time');
    expect(prompt).toContain('require learner participation');
    expect(prompt).toContain('do not write multiple completed solution steps');
  });

  it('rejects malformed explanations', async () => {
    const { provider } = createProvider(JSON.stringify({ explanation: '', steps: [] }));
    await expect(provider.explain(explanationRequest)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects an explicit arithmetic answer leak in a step-by-step lesson', async () => {
    const { provider } = createProvider(JSON.stringify({
      explanation: '2 + 2 = 4.',
      steps: [{
        stepNumber: 1,
        concept: 'Addition',
        explanation: 'Adding 2 and 2 gives 4.',
        checkQuestion: 'What is 2 + 2?',
        expectedAnswer: '4',
      }],
    }));

    await expect(provider.explain({
      question: 'What is 2 + 2?',
      subject: 'mathematics',
      grade: 'lower-primary',
      language: 'en',
      mode: 'step-by-step',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns valid practice questions', async () => {
    const { provider } = createProvider(
      JSON.stringify({
        question: 'Which process uses sunlight?',
        options: ['Photosynthesis', 'Respiration', 'Digestion', 'Evaporation'],
        correctAnswer: 'Photosynthesis',
        hint: 'Think about how plants make food.',
        explanation: 'Photosynthesis uses light energy.',
      }),
    );

    await expect(provider.createPracticeQuestion(explanationRequest)).resolves.toEqual(
      expect.objectContaining({ options: expect.arrayContaining(['Photosynthesis']) }),
    );
  });

  it('returns a structured teaching evaluation', async () => {
    const { provider } = createProvider(
      JSON.stringify({
        status: 'correct',
        reasoningAssessment: 'The learner identified that addition combines quantities.',
        feedback: 'Correct! Addition combines quantities.',
        nextAction: 'continue',
        hint: 'Now apply the idea to the next question.',
      }),
    );

    await expect(provider.evaluateTeachingAnswer({
      ...explanationRequest,
      step: {
        stepNumber: 1,
        concept: 'Addition',
        explanation: 'Addition combines quantities.',
        checkQuestion: 'What does addition do?',
        expectedAnswer: 'It combines quantities.',
      },
      learnerAnswer: 'It combines quantities.',
      attemptNumber: 1,
    })).resolves.toEqual({
      status: 'correct',
      reasoningAssessment: 'The learner identified that addition combines quantities.',
      feedback: 'Correct! Addition combines quantities.',
      nextAction: 'continue',
      hint: 'Now apply the idea to the next question.',
    });
  });

  it.each([1, 2, 3])('requests the appropriate progressive hint tier for attempt %s', async (attemptNumber) => {
    const { provider, generateContent } = createProvider(JSON.stringify({
      status: 'incorrect',
      reasoningAssessment: 'The learner needs another attempt.',
      feedback: 'Not quite. Try the operation again.',
      nextAction: 'hint',
      hint: 'Think about combining the groups.',
    }));

    await provider.evaluateTeachingAnswer({
      ...explanationRequest,
      step: {
        stepNumber: 1,
        concept: 'Addition',
        explanation: 'Addition combines quantities.',
        checkQuestion: 'What is 2 + 2?',
        expectedAnswer: '4',
      },
      learnerAnswer: '5',
      attemptNumber,
    });

    const prompt = generateContent.mock.calls[0][0].contents[0].parts[0].text;
    expect(prompt).toContain(`Attempt: ${attemptNumber}`);
    expect(prompt).toContain('gentle conceptual hint on attempt 1');
    expect(prompt).toContain('more specific guided hint on attempt 2');
    expect(prompt).toContain('strong step-by-step guidance on attempt 3 or later');
  });

  it.each([
    ['4', 'correct'],
    ['four', 'correct'],
    ['5', 'incorrect'],
    ['2 times 2', 'wrong_method'],
    ['You add the two groups together.', 'partial'],
    ["I don't know.", 'unclear'],
  ])('preserves the evaluator status for learner answer %s', async (learnerAnswer, status) => {
    const { provider } = createProvider(JSON.stringify({
      status,
      reasoningAssessment: 'Mocked reasoning assessment.',
      feedback: status === 'correct' ? 'Correct! You used addition.' : 'Try the next step.',
      nextAction: status === 'correct' ? 'continue' : 'retry',
      hint: 'Think about combining quantities.',
    }));

    await expect(provider.evaluateTeachingAnswer({
      ...explanationRequest,
      step: {
        stepNumber: 1,
        concept: 'Addition',
        explanation: 'Addition combines quantities.',
        checkQuestion: 'What is 2 + 2?',
        expectedAnswer: '4',
      },
      learnerAnswer,
      attemptNumber: 1,
    })).resolves.toEqual(expect.objectContaining({ status }));
  });

  it.each([
    { status: 'incorrect', feedback: 'Correct, you got it.' },
    { status: 'correct', feedback: 'Not quite.' },
  ])('rejects contradictory teaching feedback', async ({ status, feedback }) => {
    const { provider } = createProvider(JSON.stringify({
      status,
      reasoningAssessment: 'Assessment',
      feedback,
      nextAction: status === 'correct' ? 'continue' : 'retry',
      hint: 'Try again.',
    }));

    await expect(provider.evaluateTeachingAnswer({
      ...explanationRequest,
      step: {
        stepNumber: 1,
        concept: 'Addition',
        explanation: 'Addition combines quantities.',
        checkQuestion: 'What does addition do?',
        expectedAnswer: 'It combines quantities.',
      },
      learnerAnswer: 'It combines quantities.',
      attemptNumber: 1,
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it.each([
    { options: ['A', 'A', 'B', 'C'], correctAnswer: 'A' },
    { options: ['A', 'B', 'C', 'D'], correctAnswer: 'E' },
  ])('rejects invalid practice structure', async (practice) => {
    const { provider } = createProvider(
      JSON.stringify({
        question: 'Practice?',
        ...practice,
        hint: 'Hint',
        explanation: 'Explanation',
      }),
    );
    await expect(provider.createPracticeQuestion(explanationRequest)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps provider failures to a safe server error', async () => {
    const { provider } = createProvider(new Error('provider failure'));
    await expect(provider.explain(explanationRequest)).rejects.toEqual(
      expect.objectContaining({ message: 'AI provider is unavailable.' }),
    );
  });

  it('does not retry a successful first request', async () => {
    const { provider, generateContent } = createProvider(JSON.stringify({ explanation: 'Lesson.', steps: [] }));
    await expect(provider.explain({ ...explanationRequest, mode: 'direct' })).resolves.toEqual({ explanation: 'Lesson.', steps: [] });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('retries a transient 503 once and succeeds', async () => {
    const valid = JSON.stringify({ explanation: 'Lesson.', steps: [] });
    const { provider, generateContent } = createProvider([unavailableError(), valid]);
    await expect(provider.explain({ ...explanationRequest, mode: 'direct' })).resolves.toEqual({ explanation: 'Lesson.', steps: [] });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('retries transient 503 errors twice and succeeds on the third request', async () => {
    const valid = JSON.stringify({ explanation: 'Lesson.', steps: [] });
    const { provider, generateContent } = createProvider([unavailableError(), unavailableError(), valid]);
    await expect(provider.explain({ ...explanationRequest, mode: 'direct' })).resolves.toEqual({ explanation: 'Lesson.', steps: [] });
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('stops after two retries and preserves the safe error', async () => {
    const { provider, generateContent } = createProvider([unavailableError(), unavailableError(), unavailableError()]);
    await expect(provider.explain({ ...explanationRequest, mode: 'direct' })).rejects.toEqual(
      expect.objectContaining({ message: 'AI provider is unavailable.' }),
    );
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-503 provider errors', async () => {
    const error = Object.assign(new Error('bad request'), { status: 400 });
    const { provider, generateContent } = createProvider(error);
    await expect(provider.explain({ ...explanationRequest, mode: 'direct' })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('does not retry JSON parsing or validation failures', async () => {
    const { provider, generateContent } = createProvider('{not-json}');
    await expect(provider.explain({ ...explanationRequest, mode: 'direct' })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('fails safely when the API key or model is missing', async () => {
    const { provider: missingKey } = createProvider('{}', { geminiApiKey: '' });
    const { provider: missingModel } = createProvider('{}', { model: '' });
    await expect(missingKey.explain(explanationRequest)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(missingModel.explain(explanationRequest)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
