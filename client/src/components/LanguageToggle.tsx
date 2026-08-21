import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-muted">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          language === 'en'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        English
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setLanguage('sw')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          language === 'sw'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Kiswahili
      </motion.button>
    </div>
  );
}
