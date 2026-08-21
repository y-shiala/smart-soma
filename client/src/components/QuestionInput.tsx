import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, X, Loader2, MicOff } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { CameraCapture } from './CameraCapture';

interface QuestionInputProps {
  mode: 'scan' | 'voice' | 'type';
  onSubmit: (question: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export function QuestionInput({ mode, onSubmit, onClose, isLoading }: QuestionInputProps) {
  const { t, language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsVoiceSupported(false);
      setVoiceError(language === 'sw' 
        ? 'Kivinjari chako hakitumii utambuzi wa sauti.'
        : 'Your browser does not support voice recognition.'
      );
    }
  }, [language]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceError(language === 'sw'
        ? 'Kivinjari chako hakitumii utambuzi wa sauti.'
        : 'Your browser does not support voice recognition.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'sw' ? 'sw-KE' : 'en-KE';

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }

        if (finalTranscript) {
          setQuestion(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = '';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = language === 'sw'
              ? 'Tafadhali ruhusu ufikiaji wa maikrofoni.'
              : 'Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = language === 'sw'
              ? 'Hakuna sauti iliyosikika. Jaribu tena.'
              : 'No speech detected. Please try again.';
            break;
          case 'network':
            errorMessage = language === 'sw'
              ? 'Hitilafu ya mtandao. Angalia muunganisho wako.'
              : 'Network error. Check your connection.';
            break;
          default:
            errorMessage = language === 'sw'
              ? 'Hitilafu ilitokea. Jaribu tena.'
              : 'An error occurred. Please try again.';
        }
        
        setVoiceError(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setVoiceError(language === 'sw'
        ? 'Haikuweza kuanza utambuzi wa sauti.'
        : 'Could not start voice recognition.'
      );
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-x-0 bottom-0 z-50 p-4 bg-background border-t border-border shadow-lg"
    >
      <div className="container max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground">
            {mode === 'scan' && t('scanHomework')}
            {mode === 'voice' && t('speakQuestion')}
            {mode === 'type' && t('typeQuestion')}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {mode === 'scan' && (
          <CameraCapture
            onTextExtracted={(text) => {
              setQuestion(text);
            }}
            onClose={onClose}
          />
        )}

        {mode === 'voice' && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center py-8"
          >
            {voiceError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center max-w-sm">
                {voiceError}
              </div>
            )}
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceRecord}
              disabled={!isVoiceSupported}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                isRecording
                  ? 'bg-secondary animate-pulse shadow-lg'
                  : 'bg-primary hover:bg-primary/90 shadow-md'
              }`}
            >
              {isVoiceSupported ? (
                <Mic className={`w-10 h-10 ${isRecording ? 'text-secondary-foreground' : 'text-primary-foreground'}`} />
              ) : (
                <MicOff className="w-10 h-10 text-primary-foreground" />
              )}
            </motion.button>
            
            <p className="mt-4 text-muted-foreground font-medium">
              {isRecording 
                ? (language === 'sw' ? 'Inasikiliza...' : 'Listening...')
                : t('speakQuestion')
              }
            </p>

            {/* Live transcript display */}
            {(question || interimTranscript) && (
              <div className="mt-4 p-4 bubble-sm bg-muted w-full max-w-md">
                <p className="text-foreground">
                  {question}
                  {interimTranscript && (
                    <span className="text-muted-foreground"> {interimTranscript}</span>
                  )}
                </p>
              </div>
            )}

            {isRecording && (
              <div className="mt-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{
                      height: [8, 24, 8],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {(mode === 'type' || question) && (
          <div className="input-bubble flex items-center gap-2 p-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('typeHere')}
              className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button
              variant="action"
              size="icon"
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}