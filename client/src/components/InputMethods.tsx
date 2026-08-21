import { motion } from 'framer-motion';
import { Camera, Mic, PenLine } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InputMethodsProps {
  onScanClick: () => void;
  onVoiceClick: () => void;
  onTypeClick: () => void;
}

export function InputMethods({ onScanClick, onVoiceClick, onTypeClick }: InputMethodsProps) {
  const { t } = useLanguage();

  const methods = [
    {
      icon: Camera,
      label: t('scanHomework'),
      color: 'bg-primary',
      onClick: onScanClick,
    },
    {
      icon: Mic,
      label: t('speakQuestion'),
      color: 'bg-secondary',
      onClick: onVoiceClick,
    },
    {
      icon: PenLine,
      label: t('typeQuestion'),
      color: 'bg-success',
      onClick: onTypeClick,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-4"
    >
      {methods.map((method, index) => (
        <motion.button
          key={index}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={method.onClick}
          className="flex flex-col items-center gap-3 p-5 bubble hover:shadow-bubble-hover transition-all duration-200"
        >
          <div className={`w-14 h-14 rounded-full ${method.color} flex items-center justify-center shadow-md`}>
            <method.icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground text-center leading-tight">
            {method.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
