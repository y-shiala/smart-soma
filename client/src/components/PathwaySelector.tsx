import { motion } from 'framer-motion';
import { Palette, Globe, Cpu, Trophy, BookOpen, Atom } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PathwaySelectorProps {
  onPathwaySelect: (pathway: string) => void;
  selectedPathway?: string;
}

interface Pathway {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descriptionKey: string;
  color: string;
}

const pathways: Pathway[] = [
  { 
    id: 'arts-sports', 
    icon: Trophy, 
    labelKey: 'artsSportsPathway', 
    descriptionKey: 'artsSportsDesc',
    color: 'bg-subject-english' 
  },
  { 
    id: 'social-sciences', 
    icon: Globe, 
    labelKey: 'socialSciencesPathway', 
    descriptionKey: 'socialSciencesDesc',
    color: 'bg-subject-social' 
  },
  { 
    id: 'stem', 
    icon: Atom, 
    labelKey: 'stemPathway', 
    descriptionKey: 'stemDesc',
    color: 'bg-subject-science' 
  },
];

export function PathwaySelector({ onPathwaySelect, selectedPathway }: PathwaySelectorProps) {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">{t('choosePathway')}</h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {pathways.map((pathway) => (
          <motion.button
            key={pathway.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPathwaySelect(pathway.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
              selectedPathway === pathway.id
                ? `${pathway.color} text-primary-foreground shadow-lg ring-2 ring-primary/50`
                : 'bg-card border-2 border-border hover:border-primary/30'
            }`}
          >
            <pathway.icon className="w-8 h-8" />
            <span className="font-bold text-sm">{t(pathway.labelKey)}</span>
            <span className={`text-xs text-center ${
              selectedPathway === pathway.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}>
              {t(pathway.descriptionKey)}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
