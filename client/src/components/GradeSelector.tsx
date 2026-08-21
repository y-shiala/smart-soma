import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface GradeSelectorProps {
  onGradeSelect: (grade: string) => void;
  selectedGrade?: string;
}

const gradeCategories = [
  { id: 'lower-primary', grades: '1-3' },
  { id: 'upper-primary', grades: '4-6' },
  { id: 'junior-high', grades: '7-9' },
  { id: 'senior-high', grades: '10-12' },
];

export function GradeSelector({ onGradeSelect, selectedGrade }: GradeSelectorProps) {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">{t('chooseGrade')}</h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-3"
      >
        {gradeCategories.map((category) => (
          <motion.button
            key={category.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGradeSelect(category.id)}
            className={`flex flex-col items-center px-4 py-3 rounded-2xl transition-all duration-200 ${
              selectedGrade === category.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border-2 border-border hover:border-primary/30'
            }`}
          >
            <span className="font-semibold text-sm">{t(category.id)}</span>
            <span className="text-xs opacity-75">{t('grade')} {category.grades}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
