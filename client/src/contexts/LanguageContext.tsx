import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type Language = "en" | "sw";

interface Translations {
  [key: string]: {
    en: string;
    sw: string;
  };
}

const translations: Translations = {
  appName: { en: "Soma Smart", sw: "Soma Smart" },
  tagline: { en: "Your Learning Buddy", sw: "Rafiki Wako wa Kusoma" },
  howCanIHelp: {
    en: "How can I help you today?",
    sw: "Ninawezaje kukusaidia leo?",
  },
  scanHomework: { en: "Scan Homework", sw: "Changanua Kazi" },
  speakQuestion: { en: "Speak Question", sw: "Uliza kwa Sauti" },
  typeQuestion: { en: "Type Question", sw: "Andika Swali" },
  subjects: { en: "Choose Subject", sw: "Chagua Somo" },

  // Lower Primary Subjects (Grade 1-3)
  literacy: { en: "Literacy", sw: "Kusoma na Kuandika" },
  englishActivities: { en: "English Activities", sw: "Shughuli za Kiingereza" },
  kiswahiliActivities: {
    en: "Kiswahili Activities",
    sw: "Shughuli za Kiswahili",
  },
  indigenousLanguage: { en: "Indigenous Language", sw: "Lugha ya Asili" },
  mathematicalActivities: {
    en: "Mathematical Activities",
    sw: "Shughuli za Hesabu",
  },
  environmentalActivities: {
    en: "Environmental Activities",
    sw: "Shughuli za Mazingira",
  },
  hygieneNutrition: { en: "Hygiene & Nutrition", sw: "Usafi na Lishe" },
  religiousEducation: { en: "Religious Education", sw: "Elimu ya Dini" },
  movementCreative: { en: "Movement & Creative", sw: "Michezo na Sanaa" },

  // Upper Primary Subjects (Grade 4-6)
  english: { en: "English", sw: "Kiingereza" },
  kiswahili: { en: "Kiswahili", sw: "Kiswahili" },
  mathematics: { en: "Mathematics", sw: "Hesabu" },
  scienceTechnology: {
    en: "Science & Technology",
    sw: "Sayansi na Teknolojia",
  },
  socialStudies: { en: "Social Studies", sw: "Maarifa" },
  homeScience: { en: "Home Science", sw: "Sayansi ya Nyumbani" },
  agriculture: { en: "Agriculture", sw: "Kilimo" },
  creativeArts: { en: "Creative Arts", sw: "Sanaa za Ubunifu" },
  physicalHealthEducation: {
    en: "Physical & Health Education",
    sw: "Elimu ya Afya na Michezo",
  },

  // Junior High Subjects (Grade 7-9)
  integratedScience: { en: "Integrated Science", sw: "Sayansi Jumuishi" },
  preTechnicalStudies: {
    en: "Pre-Technical Studies",
    sw: "Masomo ya Awali ya Ufundi",
  },
  physicalEducation: { en: "Physical Education", sw: "Elimu ya Michezo" },
  lifeSkills: { en: "Life Skills", sw: "Ujuzi wa Maisha" },
  businessStudies: { en: "Business Studies", sw: "Masomo ya Biashara" },
  computerScience: { en: "Computer Science", sw: "Sayansi ya Kompyuta" },
  visualArts: { en: "Visual Arts", sw: "Sanaa za Kuona" },
  performingArts: { en: "Performing Arts", sw: "Sanaa za Maonyesho" },

  // Senior High Subjects (Grade 10-12)
  communityService: { en: "Community Service", sw: "Huduma ya Jamii" },
  lifeSkillsCitizenship: {
    en: "Life Skills & Citizenship",
    sw: "Ujuzi wa Maisha na Uraia",
  },
  music: { en: "Music", sw: "Muziki" },
  theatreFilm: { en: "Theatre & Film", sw: "Sanaa za Maonyesho na Filamu" },
  fineArt: { en: "Fine Art", sw: "Sanaa Nzuri" },
  sportsScience: { en: "Sports Science", sw: "Sayansi ya Michezo" },
  history: { en: "History", sw: "Historia" },
  geography: { en: "Geography", sw: "Jiografia" },
  economics: { en: "Economics", sw: "Uchumi" },
  religiousStudies: { en: "Religious Studies", sw: "Masomo ya Dini" },
  physics: { en: "Physics", sw: "Fizikia" },
  chemistry: { en: "Chemistry", sw: "Kemia" },
  biology: { en: "Biology", sw: "Biolojia" },
  engineeringStudies: { en: "Engineering Studies", sw: "Masomo ya Uhandisi" },

  progress: { en: "My Progress", sw: "Maendeleo Yangu" },
  parentMode: { en: "Parent Mode", sw: "Mtindo wa Mzazi" },
  questionsAnswered: { en: "Questions Answered", sw: "Maswali Yaliyojibiwa" },
  streak: { en: "Day Streak", sw: "Siku za Mfululizo" },
  practice: { en: "Practice More", sw: "Fanya Mazoezi" },
  explanation: { en: "Explanation", sw: "Maelezo" },
  stepByStep: { en: "Step by Step", sw: "Hatua kwa Hatua" },
  tryThis: { en: "Try This Question", sw: "Jaribu Swali Hili" },
  correct: { en: "Correct! Well done!", sw: "Sawa! Umefanya vizuri!" },
  tryAgain: { en: "Not quite. Try again!", sw: "Si sawa. Jaribu tena!" },
  hint: { en: "Need a hint?", sw: "Unahitaji msaada?" },
  back: { en: "Back", sw: "Rudi" },
  continue: { en: "Continue", sw: "Endelea" },
  submit: { en: "Submit", sw: "Wasilisha" },
  askAnother: { en: "Ask Another Question", sw: "Uliza Swali Lingine" },
  listening: { en: "Listening...", sw: "Nasikiliza..." },
  typeHere: {
    en: "Type your question here...",
    sw: "Andika swali lako hapa...",
  },
  uploadImage: { en: "Take a photo or upload", sw: "Piga picha au pakia" },
  cbc: { en: "CBC Curriculum", sw: "Mtaala wa CBC" },
  legacy: { en: "8-4-4 Curriculum", sw: "Mtaala wa 8-4-4" },
  grade: { en: "Grade", sw: "Darasa" },
  commonSubjects: {
    en: "Common Subjects (All Pathways)",
    sw: "Masomo ya Kawaida (Njia Zote)",
  },
  artsSportsPathway: {
    en: "Arts & Sports Science",
    sw: "Sanaa na Sayansi ya Michezo",
  },
  socialSciencesPathway: { en: "Social Sciences", sw: "Sayansi ya Jamii" },
  stemPathway: { en: "STEM", sw: "STEM" },
  choosePathway: { en: "Choose Your Pathway", sw: "Chagua Njia Yako" },
  artsSportsDesc: {
    en: "Music, Theatre, Art & Sports",
    sw: "Muziki, Sanaa, na Michezo",
  },
  socialSciencesDesc: {
    en: "History, Geography & Economics",
    sw: "Historia, Jiografia na Uchumi",
  },
  stemDesc: {
    en: "Math, Physics, Chemistry & Engineering",
    sw: "Hesabu, Fizikia, Kemia na Uhandisi",
  },

  welcomeBack: { en: "Welcome back!", sw: "Karibu tena!" },
  letsLearn: { en: "Let's learn together", sw: "Tujifunze pamoja" },
  todayGoal: { en: "Today's Goal", sw: "Lengo la Leo" },
  questionsToday: { en: "questions today", sw: "maswali leo" },
  chooseGrade: { en: "Choose Grade Level", sw: "Chagua Kiwango cha Darasa" },
  "lower-primary": { en: "Lower Primary", sw: "Msingi wa Chini" },
  "upper-primary": { en: "Upper Primary", sw: "Msingi wa Juu" },
  "junior-high": { en: "Junior High", sw: "Sekondari ya Chini" },
  "senior-high": { en: "Senior High", sw: "Sekondari ya Juu" },
  settings: { en: "Settings", sw: "Mipangilio" },
  settingsDescription: {
    en: "Set your default grade level and favorite subject",
    sw: "Weka kiwango chako cha darasa na somo unalopendelea",
  },
  saveSettings: { en: "Save Settings", sw: "Hifadhi Mipangilio" },
  settingsSaved: { en: "Settings saved!", sw: "Mipangilio imehifadhiwa!" },
  signIn: { en: "Sign In", sw: "Ingia" },
  signUp: { en: "Sign Up", sw: "Jisajili" },
  signOut: { en: "Sign Out", sw: "Toka" },
  createAccount: { en: "Create Account", sw: "Fungua Akaunti" },
  signInDescription: {
    en: "Sign in to sync your progress",
    sw: "Ingia kusawazisha maendeleo yako",
  },
  signUpDescription: {
    en: "Create an account to save your progress",
    sw: "Fungua akaunti kuhifadhi maendeleo yako",
  },
  yourName: { en: "Your Name", sw: "Jina Lako" },
  enterName: { en: "Enter your name", sw: "Ingiza jina lako" },
  email: { en: "Email", sw: "Barua pepe" },
  enterEmail: { en: "Enter your email", sw: "Ingiza barua pepe yako" },
  password: { en: "Password", sw: "Neno siri" },
  enterPassword: { en: "Enter your password", sw: "Ingiza neno siri lako" },
  loading: { en: "Loading...", sw: "Inapakia..." },
  noAccountSignUp: {
    en: "Don't have an account? Sign up",
    sw: "Huna akaunti? Jisajili",
  },
  hasAccountSignIn: {
    en: "Already have an account? Sign in",
    sw: "Una akaunti? Ingia",
  },
  accountCreated: {
    en: "Account created successfully!",
    sw: "Akaunti imeundwa!",
  },
  invalidCredentials: {
    en: "Invalid email or password",
    sw: "Barua pepe au neno siri si sahihi",
  },
  emailAlreadyExists: {
    en: "This email is already registered",
    sw: "Barua pepe hii imesajiliwa tayari",
  },
  loggedOut: { en: "Logged out successfully", sw: "Umetoka vizuri" },
  selectGrade: {
    en: "Select your grade level",
    sw: "Chagua kiwango chako cha darasa",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
