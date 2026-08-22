import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { InputMethods } from "@/components/InputMethods";
import { SubjectSelector } from "@/components/SubjectSelector";
import { GradeSelector } from "@/components/GradeSelector";
import { PathwaySelector } from "@/components/PathwaySelector";
import { ProgressCard } from "@/components/ProgressCard";
import { QuestionInput } from "@/components/QuestionInput";
import { ExplanationView } from "@/components/ExplanationView";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePreferences } from "@/hooks/usePreferences";
import { useProgress } from "@/hooks/useProgress";
import { useLearningSession } from "@/hooks/useLearningSession";
import { useAuth } from "@/hooks/useAuth";

type ViewState = "home" | "input" | "explanation";
type InputMode = "scan" | "voice" | "type";
type ExplanationMode = "step-by-step" | "direct";

function HomeContent() {
  const { language } = useLanguage();
  const { preferences, isLoaded } = usePreferences();
  const { stats, saveProgress } = useProgress();
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>("home");
  const [inputMode, setInputMode] = useState<InputMode>("type");
  const [selectedSubject, setSelectedSubject] = useState<string>("math");
  const [selectedGrade, setSelectedGrade] = useState<string>("lower-primary");
  const [selectedPathway, setSelectedPathway] = useState<string | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const learningSession = useLearningSession();

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
    setView("input");
  };

  const handleQuestionSubmit = useCallback(
    async (question: string) => {
      learningSession.startSession(question, selectedSubject, selectedGrade);
      setView("explanation");
    },
    [learningSession, selectedGrade, selectedSubject],
  );

  const handleModeSelect = useCallback(
    async (mode: ExplanationMode) => {
      await learningSession.requestExplanation(mode, language);
    },
    [language, learningSession],
  );

  const handleBack = () => {
    setView("home");
    learningSession.resetSession();
  };

  const handleAskAnother = () => {
    setView("input");
    learningSession.resetSession();
  };

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    // Clear pathway when switching away from senior-high
    if (grade !== "senior-high") {
      setSelectedPathway(undefined);
    }
  };

  if (view === "explanation") {
    return (
      <ExplanationView
        question={learningSession.session.question}
        subject={learningSession.session.subject}
        grade={learningSession.session.grade}
        explanation={learningSession.session.explanation}
        isStreaming={learningSession.explanationStatus === "loading"}
        explanationMode={learningSession.session.explanationMode}
        practiceQuestion={learningSession.session.practiceQuestion}
        selectedAnswer={learningSession.session.selectedAnswer}
        correctness={learningSession.session.correctness}
        explanationStatus={learningSession.explanationStatus}
        practiceStatus={learningSession.practiceStatus}
        answerStatus={learningSession.answerStatus}
        error={learningSession.error}
        onModeSelect={handleModeSelect}
        onRetryExplanation={handleModeSelect}
        onRequestPractice={() => learningSession.requestPractice(language)}
        onAnswerSelect={learningSession.submitAnswer}
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
          onScanClick={() => handleInputMethodClick("scan")}
          onVoiceClick={() => handleInputMethodClick("voice")}
          onTypeClick={() => handleInputMethodClick("type")}
        />

        <GradeSelector
          onGradeSelect={handleGradeSelect}
          selectedGrade={selectedGrade}
        />

        {selectedGrade === "senior-high" && (
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
        {view === "input" && (
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
