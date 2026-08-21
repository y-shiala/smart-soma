import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GradeSelector } from '@/components/GradeSelector';
import { SubjectSelector } from '@/components/SubjectSelector';
import { PathwaySelector } from '@/components/PathwaySelector';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePreferences } from '@/hooks/usePreferences';
import { toast } from 'sonner';

function SettingsContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { preferences, setPreferences, isLoaded } = usePreferences();

  const handleSave = () => {
    toast.success(t('settingsSaved'));
    navigate('/learn');
  };

  const handleGradeSelect = (grade: string) => {
    // Clear pathway when switching away from senior-high
    if (grade !== 'senior-high') {
      setPreferences({ grade, pathway: undefined });
    } else {
      setPreferences({ grade });
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-6 space-y-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-muted-foreground mb-6">{t('settingsDescription')}</p>
          
          <div className="space-y-8">
            <GradeSelector
              onGradeSelect={handleGradeSelect}
              selectedGrade={preferences.grade}
            />

            {preferences.grade === 'senior-high' && (
              <PathwaySelector
                onPathwaySelect={(pathway) => setPreferences({ pathway })}
                selectedPathway={preferences.pathway}
              />
            )}

            <SubjectSelector
              onSubjectSelect={(subject) => setPreferences({ subject })}
              selectedSubject={preferences.subject}
              selectedGrade={preferences.grade}
              selectedPathway={preferences.pathway}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50"
        >
          <div className="container">
            <Button
              onClick={handleSave}
              className="w-full gap-2"
              size="lg"
            >
              <Check className="w-5 h-5" />
              {t('saveSettings')}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function Settings() {
  return <SettingsContent />;
}
