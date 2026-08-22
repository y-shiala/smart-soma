import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
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

  const loadPreferences = useCallback(async () => {
    if (user) {
      try {
        const data = await apiFetch<{ grade: string; subject: string; pathway?: string | null }>('/preferences');
        setPreferencesState({
          grade: data.grade || defaultPreferences.grade,
          subject: data.subject || defaultPreferences.subject,
          pathway: data.pathway || undefined,
        });
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    } else {
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
  }, [user]);

  // Load preferences from database or localStorage
  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const setPreferences = useCallback(async (newPrefs: Partial<StudentPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    
    // Clear pathway if grade is not senior-high
    if (updated.grade !== 'senior-high') {
      updated.pathway = undefined;
    }
    
    setPreferencesState(updated);

    if (user) {
      try {
        const data = await apiFetch<{ grade: string; subject: string; pathway?: string | null }>('/preferences', {
          method: 'PATCH',
          body: JSON.stringify({
            grade: updated.grade,
            subject: updated.subject,
            pathway: updated.pathway || undefined,
          }),
        });

        setPreferencesState({
          grade: data.grade || defaultPreferences.grade,
          subject: data.subject || defaultPreferences.subject,
          pathway: data.pathway || undefined,
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [user, preferences]);

  return { preferences, setPreferences, isLoaded };
}
