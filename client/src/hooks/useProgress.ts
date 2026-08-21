import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      // Get total questions answered
      const { count: totalCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get today's questions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('answered_at', today.toISOString());

      // Calculate streak (consecutive days with activity)
      const { data: recentActivity } = await supabase
        .from('user_progress')
        .select('answered_at')
        .eq('user_id', user.id)
        .order('answered_at', { ascending: false })
        .limit(100);

      let streak = 0;
      if (recentActivity && recentActivity.length > 0) {
        const uniqueDays = new Set<string>();
        recentActivity.forEach(item => {
          const date = new Date(item.answered_at).toDateString();
          uniqueDays.add(date);
        });

        const sortedDays = Array.from(uniqueDays).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < sortedDays.length; i++) {
          const expectedDate = new Date(now);
          expectedDate.setDate(expectedDate.getDate() - i);
          expectedDate.setHours(0, 0, 0, 0);
          
          const activityDate = new Date(sortedDays[i]);
          activityDate.setHours(0, 0, 0, 0);
          
          if (activityDate.getTime() === expectedDate.getTime()) {
            streak++;
          } else {
            break;
          }
        }
      }

      setStats({
        questionsAnswered: totalCount || 0,
        streak,
        todayProgress: todayCount || 0,
        todayGoal: 5,
      });
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
      await supabase.from('user_progress').insert({
        user_id: user.id,
        question,
        subject,
        grade,
      });

      // Refresh stats after saving
      await fetchStats();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [user, fetchStats]);

  return { stats, isLoading, saveProgress, refetch: fetchStats };
}
