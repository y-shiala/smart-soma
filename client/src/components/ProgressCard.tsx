import { motion } from 'framer-motion';
import { Trophy, Flame, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressCardProps {
  questionsAnswered: number;
  streak: number;
  todayGoal: number;
  todayProgress: number;
}

export function ProgressCard({ questionsAnswered, streak, todayGoal, todayProgress }: ProgressCardProps) {
  const { t } = useLanguage();

  const progressPercentage = Math.min((todayProgress / todayGoal) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bubble space-y-4"
    >
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-warning" />
        {t('progress')}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{questionsAnswered}</p>
            <p className="text-xs text-muted-foreground">{t('questionsAnswered')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">{t('streak')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('todayGoal')}</span>
          <span className="font-semibold text-foreground">{todayProgress}/{todayGoal} {t('questionsToday')}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-success"
          />
        </div>
      </div>
    </motion.div>
  );
}
