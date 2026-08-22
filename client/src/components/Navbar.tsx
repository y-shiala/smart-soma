import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Home, GraduationCap, Settings, BarChart3, LogIn, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const [showBanner, setShowBanner] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    toast.success(language === 'en' ? 'Signed out successfully' : 'Umetoka kikamilifu');
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: language === 'en' ? 'Home' : 'Nyumbani', icon: Home },
    { path: '/learn', label: language === 'en' ? 'Learn' : 'Jifunze', icon: GraduationCap },
    { path: '/progress', label: language === 'en' ? 'Progress' : 'Maendeleo', icon: BarChart3 },
    { path: '/settings', label: language === 'en' ? 'Settings' : 'Mipangilio', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        {/* Compact sign-in banner */}
        {!user && showBanner && (
          <div className="bg-primary/10 px-3 py-1.5 flex items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground truncate">
              {language === 'en' ? 'Sign in to save progress' : 'Ingia kuhifadhi maendeleo'}
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 h-auto text-xs font-medium"
              onClick={() => navigate('/auth')}
            >
              {language === 'en' ? 'Sign in' : 'Ingia'}
            </Button>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="container flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:block">Soma Smart</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(link.path)}
                className={cn(
                  "gap-2",
                  location.pathname === link.path && "bg-muted text-primary"
                )}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            
            {user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'Sign Out' : 'Toka'}
                </span>
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="hidden sm:flex">
                <LogIn className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Sign In' : 'Ingia'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                location.pathname === link.path 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </button>
          ))}
          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-primary"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-xs font-medium">{language === 'en' ? 'Sign In' : 'Ingia'}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
