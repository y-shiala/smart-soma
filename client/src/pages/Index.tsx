import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { InputMethods } from '@/components/InputMethods';
import { SubjectSelector } from '@/components/SubjectSelector';
import { GradeSelector } from '@/components/GradeSelector';
import { PathwaySelector } from '@/components/PathwaySelector';
import { ProgressCard } from '@/components/ProgressCard';
import { QuestionInput } from '@/components/QuestionInput';
import { ExplanationView } from '@/components/ExplanationView';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { streamExplanation } from '@/lib/api/ai';
import { toast } from 'sonner';

type ViewState = 'home' | 'input' | 'explanation';
type InputMode = 'scan' | 'voice' | 'type';
type ExplanationMode = 'step-by-step' | 'direct';

function HomeContent() {
  const { language } = useLanguage();
  const { preferences, isLoaded } = usePreferences();
  const { stats, saveProgress } = useProgress();
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>('home');
  const [inputMode, setInputMode] = useState<InputMode>('type');
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  const [selectedGrade, setSelectedGrade] = useState<string>('lower-primary');
  const [selectedPathway, setSelectedPathway] = useState<string | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [explanationMode, setExplanationMode] = useState<ExplanationMode | null>(null);

  // Load saved preferences
  useEffect(() => {
    if (isLoaded) {
      setSelectedGrade(preferences.grade);
      setSelectedSubject(preferences.subject);
      setSelectedPathway(preferences.pathway);
    }
  }, [isLoaded, preferences.grade, preferences.subject, preferences.pathway]);

  const handleInputMethodClick = (mode: InputMode) => {
    setInputMode(mode);
    setView('input');
  };

  const handleQuestionSubmit = useCallback(async (question: string) => {
    setCurrentQuestion(question);
    setExplanation('');
    setExplanationMode(null);
    setView('explanation');
  }, []);

  const handleModeSelect = useCallback(async (mode: ExplanationMode) => {
    setExplanationMode(mode);
    setIsStreaming(true);

    await streamExplanation({
      question: currentQuestion,
      subject: selectedSubject,
      grade: selectedGrade,
      language,
      mode,
      onDelta: (text) => {
        setExplanation(prev => prev + text);
      },
      onDone: () => {
        setIsStreaming(false);
      },
      onError: (error) => {
        setIsStreaming(false);
        toast.error(error);
      },
    });
  }, [currentQuestion, selectedSubject, selectedGrade, language]);

  const handleBack = () => {
    setView('home');
    setCurrentQuestion('');
    setExplanation('');
    setIsStreaming(false);
    setExplanationMode(null);
  };

  const handleAskAnother = () => {
    setView('input');
    setCurrentQuestion('');
    setExplanation('');
    setExplanationMode(null);
  };

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    // Clear pathway when switching away from senior-high
    if (grade !== 'senior-high') {
      setSelectedPathway(undefined);
    }
  };

  if (view === 'explanation') {
    return (
      <ExplanationView
        question={currentQuestion}
        subject={selectedSubject}
        grade={selectedGrade}
        explanation={explanation}
        isStreaming={isStreaming}
        explanationMode={explanationMode}
        onModeSelect={handleModeSelect}
        onBack={handleBack}
        onAskAnother={handleAskAnother}
        onSaveProgress={saveProgress}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container px-4 py-6 space-y-8 pb-32">
        <WelcomeMessage />
        
        <InputMethods
          onScanClick={() => handleInputMethodClick('scan')}
          onVoiceClick={() => handleInputMethodClick('voice')}
          onTypeClick={() => handleInputMethodClick('type')}
        />

        <GradeSelector
          onGradeSelect={handleGradeSelect}
          selectedGrade={selectedGrade}
        />

        {selectedGrade === 'senior-high' && (
          <PathwaySelector
            onPathwaySelect={setSelectedPathway}
            selectedPathway={selectedPathway}
          />
        )}

        <SubjectSelector
          onSubjectSelect={setSelectedSubject}
          selectedSubject={selectedSubject}
          selectedGrade={selectedGrade}
          selectedPathway={selectedPathway}
        />

        {user && (
          <ProgressCard
            questionsAnswered={stats.questionsAnswered}
            streak={stats.streak}
            todayGoal={stats.todayGoal}
            todayProgress={stats.todayProgress}
          />
        )}

      </main>

      <AnimatePresence>
        {view === 'input' && (
          <QuestionInput
            mode={inputMode}
            onSubmit={handleQuestionSubmit}
            onClose={handleBack}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const Index = () => {
  return <HomeContent />;
};

export default Index;
