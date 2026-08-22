import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './useAuth';

interface ProgressStats {
  questionsAnswered: number;
  streak: number;
  todayProgress: number;
  todayGoal: number;
}

export function useProgress() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    questionsAnswered: 0,
    streak: 0,
    todayProgress: 0,
    todayGoal: 5,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats({ questionsAnswered: 0, streak: 0, todayProgress: 0, todayGoal: 5 });
      setIsLoading(false);
      return;
    }

    try {
      const nextStats = await apiFetch<ProgressStats>('/progress');
      setStats(nextStats);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const saveProgress = useCallback(async (question: string, subject: string, grade: string) => {
    if (!user) return;

    try {
      await apiFetch('/progress', {
        method: 'POST',
        body: JSON.stringify({
          question,
          subject,
          grade,
        }),
      });

      await fetchStats();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [user, fetchStats]);

  return { stats, isLoading, saveProgress, refetch: fetchStats };
}
