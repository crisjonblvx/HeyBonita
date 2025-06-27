import { useState, useEffect } from 'react';
import { BonitaChat } from '@/components/BonitaChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoScripts } from '@/components/VideoScripts';
import { GamificationPanel } from '@/components/Gamification';
import { ExportData } from '@/components/ExportData';
import { LeftSidebar } from '@/components/LeftSidebar';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Image, 
  Video, 
  Settings, 
  HelpCircle, 
  Mic, 
  Moon, 
  Sun,
  VolumeX,
  Volume2,
  Download,
  Trash2,
  Mail,
  Zap,
  Heart,
  Headphones,
  Play,
  Square,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ActiveTab = 'chat' | 'image' | 'video' | 'profile' | 'export';
type ToneMode = 'sweet-nurturing' | 'tough-love';
type ResponseMode = 'quick' | 'detailed';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [toneMode, setToneMode] = useState<ToneMode>('sweet-nurturing');
  const [responseMode, setResponseMode] = useState<ResponseMode>('detailed');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'text-to-speech' | 'speech-to-speech'>('text-to-speech');
  const [isListening, setIsListening] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const { language, setLanguage, t } = useLanguage();
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    fetch('/api/auth/status', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUserId(data.user.id);
        }
      })
      .catch(() => {
        // Not authenticated, redirect to login
        window.location.href = '/';
      });
  }, []);

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: [`/api/user/${userId}`],
    enabled: !!userId,
  });

  console.log('User data:', user, 'Loading:', userLoading);

  // Load user preferences
  useEffect(() => {
    const savedToneMode = localStorage.getItem('bonita-tone-mode') as ToneMode;
    const savedResponseMode = localStorage.getItem('bonita-response-mode') as ResponseMode;
    const savedVoiceMode = localStorage.getItem('bonita-voice-mode') as 'text-to-speech' | 'speech-to-speech';
    
    if (savedToneMode) setToneMode(savedToneMode);
    if (savedResponseMode) setResponseMode(savedResponseMode);
    if (savedVoiceMode) setVoiceMode(savedVoiceMode);
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('bonita-tone-mode', toneMode);
    localStorage.setItem('bonita-response-mode', responseMode);
    localStorage.setItem('bonita-voice-mode', voiceMode);
  }, [toneMode, responseMode, voiceMode]);

  const handleLanguageChange = (lang: 'en' | 'es' | 'pt' | 'fr') => {
    setLanguage(lang);
  };

  const handleToneModeChange = (checked: boolean) => {
    setToneMode(checked ? 'tough-love' : 'sweet-nurturing');
  };

  const handleColorSchemeChange = (scheme: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'black') => {
    setColorScheme(scheme);
  };

  const handleVoiceToggle = () => {
    const newMode = voiceMode === 'text-to-speech' ? 'speech-to-speech' : 'text-to-speech';
    setVoiceMode(newMode);
    toast({
      title: "Voice mode changed",
      description: `Switched to ${newMode.replace('-', ' ')} mode.`,
    });
  };

  const renderActiveTab = () => {
    if (!userId) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground p-8">
            Loading...
          </div>
        </div>
      );
    }

    // Default to chat view since we removed navigation
    return <BonitaChat userId={userId} toneMode={toneMode} responseMode={responseMode} voiceMode={voiceMode} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Feedback Widget with Logout */}
      <FeedbackWidget userId={userId || 0} page="home" />

      {/* Main Content with top padding for feedback bar */}
      <div className="pt-12 flex flex-col min-h-screen">
        {renderActiveTab()}
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Color Scheme Picker */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('colorScheme')}</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'red', color: 'bg-red-500' },
                  { name: 'blue', color: 'bg-blue-500' },
                  { name: 'green', color: 'bg-green-500' },
                  { name: 'purple', color: 'bg-purple-500' },
                  { name: 'orange', color: 'bg-orange-500' },
                  { name: 'pink', color: 'bg-pink-500' },
                  { name: 'black', color: 'bg-black' },
                ].map((scheme) => (
                  <Button
                    key={scheme.name}
                    size="icon"
                    variant={colorScheme === scheme.name ? "default" : "outline"}
                    className={`w-12 h-12 rounded-full ${scheme.color} hover:scale-110 transition-transform`}
                    onClick={() => handleColorSchemeChange(scheme.name)}
                  />
                ))}
              </div>
            </div>

            {/* Tone Mode */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('toneMode')}</h4>
              <div className="flex space-x-2">
                <Button
                  variant={toneMode === 'sweet-nurturing' ? "default" : "outline"}
                  onClick={() => {
                    setToneMode('sweet-nurturing');
                    localStorage.setItem('bonita-tone-mode', 'sweet-nurturing');
                  }}
                  className="flex-1"
                >
                  💖 {t('sweetNurturing')}
                </Button>
                <Button
                  variant={toneMode === 'tough-love' ? "default" : "outline"}
                  onClick={() => {
                    setToneMode('tough-love');
                    localStorage.setItem('bonita-tone-mode', 'tough-love');
                  }}
                  className="flex-1"
                >
                  💪 {t('toughLove')}
                </Button>
              </div>
            </div>

            {/* Response Mode */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('responseMode')}</h4>
              <div className="flex space-x-2">
                <Button
                  variant={responseMode === 'quick' ? "default" : "outline"}
                  onClick={() => {
                    setResponseMode('quick');
                    localStorage.setItem('bonita-response-mode', 'quick');
                  }}
                  className="flex-1"
                >
                  ⚡ {t('quick')}
                </Button>
                <Button
                  variant={responseMode === 'detailed' ? "default" : "outline"}
                  onClick={() => {
                    setResponseMode('detailed');
                    localStorage.setItem('bonita-response-mode', 'detailed');
                  }}
                  className="flex-1"
                >
                  📝 {t('detailed')}
                </Button>
              </div>
            </div>

            {/* Voice Mode */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('voiceMode')}</h4>
              <div className="flex space-x-2">
                <Button
                  variant={voiceMode === 'text-to-speech' ? "default" : "outline"}
                  onClick={() => {
                    setVoiceMode('text-to-speech');
                    localStorage.setItem('bonita-voice-mode', 'text-to-speech');
                  }}
                  className="flex-1"
                >
                  <VolumeX className="mr-2 h-4 w-4" />
                  {t('textToSpeech')}
                </Button>
                <Button
                  variant={voiceMode === 'speech-to-speech' ? "default" : "outline"}
                  onClick={() => {
                    setVoiceMode('speech-to-speech');
                    localStorage.setItem('bonita-voice-mode', 'speech-to-speech');
                  }}
                  className="flex-1"
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  {t('speechToSpeech')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('helpSupport')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">{t('needHelp')}</p>
              <ul className="space-y-2 list-disc pl-5">
                <li>{t('helpChat')}</li>
                <li>{t('helpImages')}</li>
                <li>{t('helpScripts')}</li>
                <li>{t('helpProfile')}</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-border">
              <Button 
                onClick={() => window.open('mailto:cj@heybonita.ai?subject=Bonita Support Request', '_blank')}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                {t('contactSupport')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
