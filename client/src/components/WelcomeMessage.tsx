import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function WelcomeMessage() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-2 py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning-foreground"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold">{t('welcomeBack')}</span>
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground">{t('howCanIHelp')}</h2>
      <p className="text-muted-foreground">{t('letsLearn')}</p>
    </motion.div>
  );
}
