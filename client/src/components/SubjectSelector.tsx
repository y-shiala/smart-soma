import { motion } from 'framer-motion';
import { 
  Calculator, BookA, Languages, FlaskConical, Globe, 
  Utensils, Church, Palette, Dumbbell, Leaf, Home,
  BookOpen, MessageCircle, Wrench, Heart, Briefcase, 
  Monitor, PenTool, Music, Drama, GraduationCap, History,
  DollarSign, Atom, Cpu, Settings, Beaker, Users, Trophy
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubjectSelectorProps {
  onSubjectSelect: (subject: string) => void;
  selectedSubject?: string;
  selectedGrade?: string;
  selectedPathway?: string;
}

interface Subject {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  color: string;
}

const lowerPrimarySubjects: Subject[] = [
  { id: 'literacy', icon: BookOpen, labelKey: 'literacy', color: 'bg-subject-english' },
  { id: 'english-activities', icon: BookA, labelKey: 'englishActivities', color: 'bg-subject-math' },
  { id: 'kiswahili-activities', icon: Languages, labelKey: 'kiswahiliActivities', color: 'bg-subject-kiswahili' },
  { id: 'indigenous-language', icon: MessageCircle, labelKey: 'indigenousLanguage', color: 'bg-accent' },
  { id: 'mathematical-activities', icon: Calculator, labelKey: 'mathematicalActivities', color: 'bg-subject-science' },
  { id: 'environmental-activities', icon: Leaf, labelKey: 'environmentalActivities', color: 'bg-success' },
  { id: 'hygiene-nutrition', icon: Utensils, labelKey: 'hygieneNutrition', color: 'bg-secondary' },
  { id: 'religious-education', icon: Church, labelKey: 'religiousEducation', color: 'bg-subject-social' },
  { id: 'movement-creative', icon: Palette, labelKey: 'movementCreative', color: 'bg-primary' },
];

const upperPrimarySubjects: Subject[] = [
  { id: 'english', icon: BookA, labelKey: 'english', color: 'bg-subject-english' },
  { id: 'kiswahili', icon: Languages, labelKey: 'kiswahili', color: 'bg-subject-kiswahili' },
  { id: 'mathematics', icon: Calculator, labelKey: 'mathematics', color: 'bg-subject-math' },
  { id: 'science-technology', icon: FlaskConical, labelKey: 'scienceTechnology', color: 'bg-subject-science' },
  { id: 'social-studies', icon: Globe, labelKey: 'socialStudies', color: 'bg-subject-social' },
  { id: 'home-science', icon: Home, labelKey: 'homeScience', color: 'bg-secondary' },
  { id: 'agriculture', icon: Leaf, labelKey: 'agriculture', color: 'bg-success' },
  { id: 'religious-education', icon: Church, labelKey: 'religiousEducation', color: 'bg-accent' },
  { id: 'creative-arts', icon: Palette, labelKey: 'creativeArts', color: 'bg-primary' },
  { id: 'physical-health-education', icon: Dumbbell, labelKey: 'physicalHealthEducation', color: 'bg-warning' },
];

// Junior High Core Subjects
const juniorHighSubjects: Subject[] = [
  { id: 'english', icon: BookA, labelKey: 'english', color: 'bg-subject-english' },
  { id: 'kiswahili', icon: Languages, labelKey: 'kiswahili', color: 'bg-subject-kiswahili' },
  { id: 'mathematics', icon: Calculator, labelKey: 'mathematics', color: 'bg-subject-math' },
  { id: 'integrated-science', icon: FlaskConical, labelKey: 'integratedScience', color: 'bg-subject-science' },
  { id: 'social-studies', icon: Globe, labelKey: 'socialStudies', color: 'bg-subject-social' },
  { id: 'pre-technical-studies', icon: Wrench, labelKey: 'preTechnicalStudies', color: 'bg-secondary' },
  { id: 'religious-education', icon: Church, labelKey: 'religiousEducation', color: 'bg-accent' },
  { id: 'physical-education', icon: Dumbbell, labelKey: 'physicalEducation', color: 'bg-warning' },
  { id: 'life-skills', icon: Heart, labelKey: 'lifeSkills', color: 'bg-success' },
  // Electives
  { id: 'business-studies', icon: Briefcase, labelKey: 'businessStudies', color: 'bg-primary' },
  { id: 'computer-science', icon: Monitor, labelKey: 'computerScience', color: 'bg-subject-math' },
  { id: 'visual-arts', icon: PenTool, labelKey: 'visualArts', color: 'bg-subject-english' },
  { id: 'performing-arts', icon: Music, labelKey: 'performingArts', color: 'bg-subject-kiswahili' },
  { id: 'home-science', icon: Home, labelKey: 'homeScience', color: 'bg-subject-social' },
  { id: 'agriculture', icon: Leaf, labelKey: 'agriculture', color: 'bg-success' },
];

// Senior High - Grouped by pathway
interface SubjectGroup {
  labelKey: string;
  subjects: Subject[];
}

const seniorHighGroups: SubjectGroup[] = [
  {
    labelKey: 'commonSubjects',
    subjects: [
      { id: 'community-service', icon: Users, labelKey: 'communityService', color: 'bg-success' },
      { id: 'physical-education', icon: Dumbbell, labelKey: 'physicalEducation', color: 'bg-warning' },
      { id: 'religious-education', icon: Church, labelKey: 'religiousEducation', color: 'bg-accent' },
      { id: 'life-skills', icon: Heart, labelKey: 'lifeSkillsCitizenship', color: 'bg-primary' },
    ],
  },
  {
    labelKey: 'artsSportsPathway',
    subjects: [
      { id: 'music', icon: Music, labelKey: 'music', color: 'bg-subject-english' },
      { id: 'theatre-film', icon: Drama, labelKey: 'theatreFilm', color: 'bg-subject-kiswahili' },
      { id: 'fine-art', icon: Palette, labelKey: 'fineArt', color: 'bg-subject-social' },
      { id: 'sports-science', icon: Trophy, labelKey: 'sportsScience', color: 'bg-warning' },
    ],
  },
  {
    labelKey: 'socialSciencesPathway',
    subjects: [
      { id: 'history', icon: History, labelKey: 'history', color: 'bg-secondary' },
      { id: 'geography', icon: Globe, labelKey: 'geography', color: 'bg-subject-social' },
      { id: 'economics', icon: DollarSign, labelKey: 'economics', color: 'bg-success' },
      { id: 'religious-studies', icon: GraduationCap, labelKey: 'religiousStudies', color: 'bg-accent' },
    ],
  },
  {
    labelKey: 'stemPathway',
    subjects: [
      { id: 'mathematics', icon: Calculator, labelKey: 'mathematics', color: 'bg-subject-math' },
      { id: 'physics', icon: Atom, labelKey: 'physics', color: 'bg-subject-science' },
      { id: 'chemistry', icon: Beaker, labelKey: 'chemistry', color: 'bg-subject-kiswahili' },
      { id: 'biology', icon: Leaf, labelKey: 'biology', color: 'bg-success' },
      { id: 'computer-science', icon: Cpu, labelKey: 'computerScience', color: 'bg-subject-math' },
      { id: 'engineering-studies', icon: Settings, labelKey: 'engineeringStudies', color: 'bg-secondary' },
    ],
  },
];

function getSubjectsForGrade(grade: string): Subject[] | null {
  switch (grade) {
    case 'lower-primary':
      return lowerPrimarySubjects;
    case 'upper-primary':
      return upperPrimarySubjects;
    case 'junior-high':
      return juniorHighSubjects;
    case 'senior-high':
      return null; // Uses grouped view
    default:
      return upperPrimarySubjects;
  }
}

function SubjectButton({ 
  subject, 
  isSelected, 
  onSelect, 
  t, 
  itemVariants 
}: { 
  subject: Subject; 
  isSelected: boolean; 
  onSelect: () => void; 
  t: (key: string) => string;
  itemVariants: any;
}) {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
        isSelected
          ? `${subject.color} text-primary-foreground shadow-md`
          : 'bg-card border-2 border-border hover:border-primary/30'
      }`}
    >
      <subject.icon className="w-4 h-4" />
      <span className="font-semibold text-xs">{t(subject.labelKey)}</span>
    </motion.button>
  );
}

export function SubjectSelector({ onSubjectSelect, selectedSubject, selectedGrade = 'lower-primary', selectedPathway }: SubjectSelectorProps) {
  const { t } = useLanguage();

  const subjects = getSubjectsForGrade(selectedGrade);
  const isSeniorHigh = selectedGrade === 'senior-high';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  // Get filtered groups for senior high based on pathway
  const getFilteredGroups = () => {
    if (!selectedPathway) {
      // Show only common subjects when no pathway is selected
      return seniorHighGroups.filter(g => g.labelKey === 'commonSubjects');
    }
    
    const pathwayMap: Record<string, string> = {
      'arts-sports': 'artsSportsPathway',
      'social-sciences': 'socialSciencesPathway',
      'stem': 'stemPathway',
    };
    
    const pathwayLabelKey = pathwayMap[selectedPathway];
    return seniorHighGroups.filter(g => 
      g.labelKey === 'commonSubjects' || g.labelKey === pathwayLabelKey
    );
  };

  if (isSeniorHigh) {
    const filteredGroups = getFilteredGroups();
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">{t('subjects')}</h3>
        <motion.div
          key={`${selectedGrade}-${selectedPathway}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredGroups.map((group) => (
            <div key={group.labelKey} className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground border-b border-border pb-1">
                {t(group.labelKey)}
              </h4>
              <div className="flex flex-wrap gap-2">
                {group.subjects.map((subject) => (
                  <SubjectButton
                    key={subject.id}
                    subject={subject}
                    isSelected={selectedSubject === subject.id}
                    onSelect={() => onSubjectSelect(subject.id)}
                    t={t}
                    itemVariants={itemVariants}
                  />
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">{t('subjects')}</h3>
      <motion.div
        key={selectedGrade}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-2"
      >
        {subjects?.map((subject) => (
          <SubjectButton
            key={subject.id}
            subject={subject}
            isSelected={selectedSubject === subject.id}
            onSelect={() => onSubjectSelect(subject.id)}
            t={t}
            itemVariants={itemVariants}
          />
        ))}
      </motion.div>
    </div>
  );
}
