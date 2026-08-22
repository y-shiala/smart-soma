import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Loader2,
  BookOpen,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import {
  generatePracticeQuestion,
  submitPracticeAttempt,
  type PracticeAttemptResult,
  type PracticeQuestion,
} from "@/lib/api/ai";

type ExplanationMode = "step-by-step" | "direct";

interface ExplanationViewProps {
  question: string;
  subject: string;
  grade: string;
  explanation: string;
  isStreaming: boolean;
  explanationMode: ExplanationMode | null;
  onModeSelect: (mode: ExplanationMode) => void;
  onBack: () => void;
  onAskAnother: () => void;
  onSaveProgress: (
    question: string,
    subject: string,
    grade: string,
  ) => Promise<void>;
}

export function ExplanationView({
  question,
  subject,
  grade,
  explanation,
  isStreaming,
  explanationMode,
  onModeSelect,
  onBack,
  onAskAnother,
  onSaveProgress,
}: ExplanationViewProps) {
  const { t, language } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [attemptResult, setAttemptResult] =
    useState<PracticeAttemptResult | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [practiceQuestion, setPracticeQuestion] =
    useState<PracticeQuestion | null>(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressSaved, setProgressSaved] = useState(false);

  // Save progress when explanation streaming completes
  useEffect(() => {
    if (!isStreaming && explanation && explanationMode && !progressSaved) {
      onSaveProgress(question, subject, grade);
      setProgressSaved(true);
    }
  }, [
    isStreaming,
    explanation,
    explanationMode,
    progressSaved,
    onSaveProgress,
    question,
    subject,
    grade,
  ]);

  // Clean markdown formatting from text
  const cleanText = (text: string) => {
    return text
      .replace(/^#+\s*/gm, "") // Remove heading hashes
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold asterisks
      .replace(/\*([^*]+)\*/g, "$1") // Remove italic asterisks
      .replace(/__([^_]+)__/g, "$1") // Remove bold underscores
      .replace(/_([^_]+)_/g, "$1") // Remove italic underscores
      .replace(/`([^`]+)`/g, "$1") // Remove inline code backticks
      .trim();
  };

  // Parse explanation into steps
  const parseSteps = (text: string) => {
    const cleanedText = cleanText(text);
    const lines = cleanedText.split("\n").filter((line) => line.trim());
    const steps: string[] = [];
    let currentStepText = "";

    lines.forEach((line) => {
      // Check if line starts a new step (numbered or has step indicator)
      const isNewStep = /^(\d+[\.\):]|step\s*\d+|hatua\s*\d+)/i.test(
        line.trim(),
      );

      if (isNewStep && currentStepText) {
        steps.push(currentStepText.trim());
        currentStepText = line;
      } else if (isNewStep) {
        currentStepText = line;
      } else if (currentStepText) {
        currentStepText += "\n" + line;
      } else {
        // First content before any step marker
        currentStepText = line;
      }
    });

    if (currentStepText) {
      steps.push(currentStepText.trim());
    }

    // If no clear steps found, treat each paragraph as a step
    if (steps.length <= 1 && cleanedText.length > 100) {
      return lines.reduce((acc: string[], line, i) => {
        if (i % 2 === 0) {
          acc.push(line);
        } else {
          acc[acc.length - 1] += "\n" + line;
        }
        return acc;
      }, []);
    }

    return steps.length > 0 ? steps : lines;
  };

  const explanationSteps = parseSteps(explanation);
  const allStepsShown =
    explanationMode === "direct" || currentStep >= explanationSteps.length - 1;
  const visibleSteps =
    explanationMode === "direct"
      ? explanationSteps
      : explanationSteps.slice(0, currentStep + 1);

  // Generate practice question when all steps are shown and streaming is done
  useEffect(() => {
    if (
      !isStreaming &&
      explanation &&
      allStepsShown &&
      !practiceQuestion &&
      !loadingPractice
    ) {
      setLoadingPractice(true);
      setPracticeError(null);

      generatePracticeQuestion({
        topic: question,
        subject,
        grade,
        difficulty: "easy",
        language,
        mode: explanationMode ?? "direct",
      })
        .then(setPracticeQuestion)
        .catch((err) => {
          console.error("Failed to generate practice question:", err);
          setPracticeError(err.message);
        })
        .finally(() => setLoadingPractice(false));
    }
  }, [
    isStreaming,
    explanation,
    question,
    subject,
    language,
    practiceQuestion,
    loadingPractice,
    allStepsShown,
  ]);

  const handleAnswerSelect = async (index: number) => {
    setSelectedAnswer(index);
    setIsSubmittingAnswer(true);
    setPracticeError(null);

    try {
      const result = await submitPracticeAttempt({
        question,
        subject,
        grade,
        selectedAnswer: practiceQuestion?.options[index] ?? "",
      });
      setAttemptResult(result);
      setShowResult(true);
    } catch (error) {
      setPracticeError(
        error instanceof Error
          ? error.message
          : "Unable to submit your answer.",
      );
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < explanationSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const isCorrect = attemptResult?.correct ?? false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="container flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground capitalize">
              {subject}
            </p>
            <h2 className="font-bold text-foreground leading-tight">
              {t("explanation")}
            </h2>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Question Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="border-primary/20 bg-primary/5 transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-primary" />
                </div>
                {language === "sw" ? "Swali Lako" : "Your Question"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {question}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mode Selection */}
        {explanationMode === null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          >
            <Card className="transition-shadow duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-center text-base">
                  {language === "sw"
                    ? "Ungependa kujifunza vipi?"
                    : "How would you like to learn?"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onModeSelect("step-by-step")}
                  className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:border-primary/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {language === "sw" ? "Hatua kwa Hatua" : "Step by Step"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "sw"
                          ? "Jifunze polepole, hatua moja kwa wakati"
                          : "Learn slowly, one step at a time"}
                      </p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onModeSelect("direct")}
                  className="p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30 hover:border-secondary/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {language === "sw"
                          ? "Jibu Moja kwa Moja"
                          : "Direct Answer"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "sw"
                          ? "Ona jibu fupi na wazi"
                          : "Get a short, clear answer"}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Explanation Card - only show after mode is selected */}
        {explanationMode !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <Card className="border-warning/20 transition-shadow duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  {explanationMode === "step-by-step"
                    ? t("stepByStep")
                    : language === "sw"
                      ? "Maelezo"
                      : "Explanation"}
                  {isStreaming && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {visibleSteps.length > 0 ? (
                  visibleSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                    >
                      <Card className="bg-muted/50 border-none shadow-none transition-all duration-200 hover:bg-muted/70">
                        <CardContent className="p-4 flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <p className="text-foreground leading-relaxed whitespace-pre-line pt-0.5">
                            {step}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    {isStreaming
                      ? language === "sw"
                        ? "Inafikiri..."
                        : "Thinking..."
                      : ""}
                  </p>
                )}

                {isStreaming && (
                  <span className="inline-block w-2 h-5 bg-primary animate-pulse rounded-sm ml-10" />
                )}

                {/* Next Step Button - only in step-by-step mode */}
                {explanationMode === "step-by-step" &&
                  !isStreaming &&
                  explanationSteps.length > 1 &&
                  !allStepsShown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="pt-2"
                    >
                      <Button
                        onClick={() => setCurrentStep((prev) => prev + 1)}
                        className="w-full"
                        size="lg"
                      >
                        {language === "sw" ? "Hatua Inayofuata" : "Next Step"}
                        <span className="ml-2 text-xs opacity-70">
                          ({currentStep + 1}/{explanationSteps.length})
                        </span>
                      </Button>
                    </motion.div>
                  )}

                {/* All Steps Complete */}
                {!isStreaming &&
                  allStepsShown &&
                  explanationSteps.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 text-success font-medium pt-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {language === "sw"
                        ? "Umekamilisha hatua zote!"
                        : "All steps complete!"}
                    </motion.div>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Practice Question Card - only show after all steps are revealed */}
        {explanationMode !== null && !isStreaming && allStepsShown && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            <Card className="border-secondary/20 bg-secondary/5 transition-shadow duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  {t("tryThis")}
                  {loadingPractice && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {practiceError && (
                  <p className="text-destructive text-sm">{practiceError}</p>
                )}

                {practiceQuestion && (
                  <>
                    <p className="text-lg font-semibold text-foreground">
                      {practiceQuestion.question}
                    </p>

                    <div className="grid gap-3">
                      {practiceQuestion.options.map((option, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            !showResult &&
                            !isSubmittingAnswer &&
                            handleAnswerSelect(index)
                          }
                          disabled={showResult || isSubmittingAnswer}
                          className={`p-4 rounded-xl text-left font-medium transition-all duration-200 ${
                            showResult
                              ? index === practiceQuestion.correctIndex
                                ? "bg-success/10 border-2 border-success text-success"
                                : selectedAnswer === index
                                  ? "bg-destructive/10 border-2 border-destructive text-destructive"
                                  : "bg-muted text-muted-foreground"
                              : "bg-muted hover:bg-primary/5 hover:border-primary/30 border-2 border-transparent text-foreground"
                          }`}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold">
                              {String.fromCharCode(65 + index)}
                            </span>
                            {option}
                            {showResult &&
                              index === practiceQuestion.correctIndex && (
                                <CheckCircle2 className="w-5 h-5 ml-auto" />
                              )}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    {!showResult && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHint(!showHint)}
                        className="text-muted-foreground"
                      >
                        <HelpCircle className="w-4 h-4 mr-2" />
                        {t("hint")}
                      </Button>
                    )}

                    {showHint && !showResult && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-muted-foreground bg-muted p-3 rounded-xl"
                      >
                        {practiceQuestion.hint}
                      </motion.p>
                    )}

                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl ${
                          isCorrect
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning-foreground"
                        }`}
                      >
                        <p className="font-bold text-lg">
                          {isCorrect ? t("correct") : t("tryAgain")}
                        </p>
                        {showResult &&
                          (attemptResult?.explanation ||
                            practiceQuestion.explanation) && (
                            <p className="text-sm mt-2 opacity-80">
                              {attemptResult?.explanation ||
                                practiceQuestion.explanation}
                            </p>
                          )}
                      </motion.div>
                    )}
                  </>
                )}

                {!practiceQuestion && !loadingPractice && !practiceError && (
                  <p className="text-muted-foreground text-sm">
                    {language === "sw"
                      ? "Inaandaa swali la mazoezi..."
                      : "Preparing practice question..."}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            {t("back")}
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={onAskAnother}
            disabled={isStreaming}
          >
            {t("askAnother")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
