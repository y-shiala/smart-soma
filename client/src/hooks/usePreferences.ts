import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StudentPreferences {
  grade: string;
  subject: string;
  pathway?: string;
}

const STORAGE_KEY = 'soma-smart-preferences';

const defaultPreferences: StudentPreferences = {
  grade: 'lower-primary',
  subject: 'math',
  pathway: undefined,
};

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferencesState] = useState<StudentPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from database or localStorage
  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        // Load from database for logged-in users
        const { data, error } = await supabase
          .from('user_preferences')
          .select('grade, subject, pathway')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data && !error) {
          setPreferencesState({
            grade: data.grade || defaultPreferences.grade,
            subject: data.subject || defaultPreferences.subject,
            pathway: data.pathway || undefined,
          });
        }
      } else {
        // Load from localStorage for guests
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setPreferencesState({ ...defaultPreferences, ...parsed });
          } catch {
            setPreferencesState(defaultPreferences);
          }
        }
      }
      setIsLoaded(true);
    };

    loadPreferences();
  }, [user]);

  const setPreferences = useCallback(async (newPrefs: Partial<StudentPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    
    // Clear pathway if grade is not senior-high
    if (updated.grade !== 'senior-high') {
      updated.pathway = undefined;
    }
    
    setPreferencesState(updated);

    if (user) {
      // Save to database for logged-in users
      await supabase
        .from('user_preferences')
        .update({
          grade: updated.grade,
          subject: updated.subject,
          pathway: updated.pathway || null,
        })
        .eq('user_id', user.id);
    } else {
      // Save to localStorage for guests
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [user, preferences]);

  return { preferences, setPreferences, isLoaded };
}
