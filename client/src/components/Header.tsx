import { motion } from 'framer-motion';
import { BookOpen, User, Settings, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface HeaderProps {
  showParentMode?: boolean;
  onParentModeClick?: () => void;
}

export function Header({ showParentMode = true, onParentModeClick }: HeaderProps) {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('loggedOut'));
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16 px-4">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{t('appName')}</h1>
            <p className="text-xs text-muted-foreground">{t('tagline')}</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
          {showParentMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onParentModeClick}
              className="text-muted-foreground hover:text-foreground"
            >
              <User className="w-5 h-5" />
            </Button>
          )}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
