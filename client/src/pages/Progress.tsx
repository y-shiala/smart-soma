import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock3, Target, Trophy, XCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLearningHistory, getProgressSummary, type LearningHistoryItem, type ProgressSummary } from '@/lib/api/progress';

const emptySummary: ProgressSummary = {
  questionsAnswered: 0,
  streak: 0,
  todayProgress: 0,
  todayGoal: 5,
  totalLearningActivities: 0,
  totalPracticeAttempts: 0,
  correctAttempts: 0,
  incorrectAttempts: 0,
  accuracyPercentage: 0,
  questionsPracticed: [],
};

function formatGrade(grade: string | null): string {
  return grade?.replaceAll('-', ' ') ?? 'Grade not recorded';
}

function ProgressContent() {
  const { language } = useLanguage();
  const [summary, setSummary] = useState(emptySummary);
  const [history, setHistory] = useState<LearningHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getProgressSummary(), getLearningHistory()])
      .then(([nextSummary, nextHistory]) => {
        if (!active) return;
        setSummary(nextSummary);
        setHistory(nextHistory);
      })
      .catch(() => {
        if (active) setError(language === 'sw' ? 'Haikuweza kupakia maendeleo yako.' : 'Unable to load your progress.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [language]);

  const todayPercentage = Math.min((summary.todayProgress / summary.todayGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="container px-4 py-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">{language === 'sw' ? 'Muhtasari wa kujifunza' : 'Your learning summary'}</p>
          <h1 className="text-2xl font-bold text-foreground">{language === 'sw' ? 'Maendeleo Yangu' : 'My Progress'}</h1>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div><p className="text-2xl font-bold">{isLoading ? '-' : summary.totalLearningActivities}</p><p className="text-xs text-muted-foreground">Learning activities</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-secondary" />
              <div><p className="text-2xl font-bold">{isLoading ? '-' : summary.totalPracticeAttempts}</p><p className="text-xs text-muted-foreground">Practice attempts</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-warning" />
              <div><p className="text-2xl font-bold">{isLoading ? '-' : `${summary.accuracyPercentage}%`}</p><p className="text-xs text-muted-foreground">Accuracy</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock3 className="w-5 h-5 text-success" />
              <div><p className="text-2xl font-bold">{isLoading ? '-' : summary.streak}</p><p className="text-xs text-muted-foreground">Day streak</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Today&apos;s goal</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-semibold">{summary.todayProgress}/{summary.todayGoal}</span></div>
            <ProgressBar value={todayPercentage} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader><CardTitle className="text-base">Practice results</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-success/10 p-4"><CheckCircle2 className="w-5 h-5 text-success" /><p className="mt-2 text-2xl font-bold">{summary.correctAttempts}</p><p className="text-xs text-muted-foreground">Correct</p></div>
              <div className="rounded-lg bg-destructive/10 p-4"><XCircle className="w-5 h-5 text-destructive" /><p className="mt-2 text-2xl font-bold">{summary.incorrectAttempts}</p><p className="text-xs text-muted-foreground">Incorrect</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Topics practiced</CardTitle></CardHeader>
            <CardContent>
              {summary.questionsPracticed.length === 0 ? <p className="text-sm text-muted-foreground">No practice questions yet.</p> : <ul className="space-y-2">{summary.questionsPracticed.map((question) => <li key={question} className="text-sm text-foreground">{question}</li>)}</ul>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? <p className="text-sm text-muted-foreground">No learning activity yet.</p> : <div className="space-y-3">{history.map((item) => <div key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-foreground">{item.question}</p><p className="text-xs text-muted-foreground capitalize">{item.type === 'practice-attempt' ? 'Practice attempt' : 'Explanation'}{item.subject ? ` · ${item.subject}` : ''}{item.grade ? ` · ${formatGrade(item.grade)}` : ''}</p>{item.selectedAnswer && <p className="mt-1 text-xs text-muted-foreground">Answer: {item.selectedAnswer}</p>}</div>{item.type === 'practice-attempt' && (item.correct ? <CheckCircle2 className="w-5 h-5 shrink-0 text-success" /> : <XCircle className="w-5 h-5 shrink-0 text-destructive" />)}</div><p className="mt-1 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p></div>)}</div>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Progress() {
  return <ProgressContent />;
}
