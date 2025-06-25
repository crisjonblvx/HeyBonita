import { useState, useEffect } from 'react';
import { BonitaChat } from '@/components/BonitaChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoScripts } from '@/components/VideoScripts';
import { GamificationPanel } from '@/components/Gamification';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  Mail,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define Bonita avatar URL
const bonitaAvatarUrl = "/images/bonita-logo-alpha.png";

type ActiveTab = 'chat' | 'image' | 'video' | 'profile';
type ToneMode = 'sweet-nurturing' | 'tough-love';
type ResponseMode = 'quick' | 'detailed';

export default function MobileHome() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    // Initialize from localStorage immediately to prevent flash
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bonita-mobile-tab') as ActiveTab;
      return saved || 'chat';
    }
    return 'chat';
  });
  const [toneMode, setToneMode] = useState<ToneMode>('sweet-nurturing');
  const [responseMode, setResponseMode] = useState<ResponseMode>('detailed');
  const [showSettings, setShowSettings] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'text-to-speech' | 'speech-to-speech'>('text-to-speech');
  const [userId] = useState(1);

  const { language, setLanguage, t } = useLanguage();
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const { toast } = useToast();

  // Fetch user data with better caching
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: [`/api/user/${userId}`],
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Load user preferences (excluding activeTab which is handled in useState)
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
    localStorage.setItem('bonita-mobile-tab', activeTab);
    console.log('Mobile: Saved active tab to localStorage:', activeTab);
  }, [toneMode, responseMode, voiceMode, activeTab]);

  const renderActiveTab = () => {
    console.log('Rendering active tab:', activeTab);
    
    // Use React.memo equivalent approach to prevent unnecessary re-renders
    if (activeTab === 'chat') {
      return <BonitaChat key="chat" userId={userId} toneMode={toneMode} responseMode={responseMode} voiceMode={voiceMode} />;
    }
    
    if (activeTab === 'image') {
      return (
        <div key="image" className="h-full">
          <ImageGenerator userId={userId} />
        </div>
      );
    }
    
    if (activeTab === 'video') {
      return <VideoScripts key="video" userId={userId} toneMode={toneMode} responseMode={responseMode} />;
    }
    
    if (activeTab === 'profile') {
      if (userLoading) {
        return (
          <div key="profile-loading" className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground p-8">
              Loading profile...
            </div>
          </div>
        );
      }
      
      if (!user) {
        return (
          <div key="profile-error" className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground p-8">
              Unable to load profile
            </div>
          </div>
        );
      }
      
      return <GamificationPanel key="profile" userId={userId} user={user} />;
    }
    
    // Default fallback
    return <BonitaChat key="default" userId={userId} toneMode={toneMode} responseMode={responseMode} voiceMode={voiceMode} />;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <img 
            src="/images/bonita-logo-alpha.png" 
            alt="Bonita" 
            className="h-8 w-8"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-lg font-bold">Bonita</h1>
            <p className="text-xs text-muted-foreground">Digital Bronx Auntie</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="h-9 w-9 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t bg-background">
        <div className="flex">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('chat');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
              activeTab === 'chat'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            Chat
          </button>
          <button
            onClick={() => {
              console.log('Image button clicked - switching to image tab');
              setActiveTab('image');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
              activeTab === 'image'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Image className="h-5 w-5 mb-1" />
            Images
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('video');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
              activeTab === 'video'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video className="h-5 w-5 mb-1" />
            Scripts
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('profile');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
              activeTab === 'profile'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="h-5 w-5 mb-1" />
            Profile
          </button>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="w-[95%] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <div className="grid grid-cols-2 gap-2">
                {(['en', 'es', 'pt', 'fr'] as const).map((lang) => (
                  <Button
                    key={lang}
                    variant={language === lang ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage(lang)}
                    className="text-xs h-8"
                  >
                    {lang.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {(['red', 'blue', 'green', 'purple'] as const).map((color) => (
                  <Button
                    key={color}
                    variant={colorScheme === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setColorScheme(color)}
                    className="text-xs h-8 capitalize"
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tone Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {toneMode === 'sweet-nurturing' ? 'Sweet & Nurturing' : 'Tough Love'}
                </span>
                <Switch
                  checked={toneMode === 'sweet-nurturing'}
                  onCheckedChange={(checked) => setToneMode(checked ? 'sweet-nurturing' : 'tough-love')}
                />
              </div>
            </div>

            {/* Response Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Response Style</label>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {responseMode === 'detailed' ? 'Detailed' : 'Quick'}
                </span>
                <Switch
                  checked={responseMode === 'detailed'}
                  onCheckedChange={(checked) => setResponseMode(checked ? 'detailed' : 'quick')}
                />
              </div>
            </div>

            {/* Voice Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Mode</label>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {voiceMode === 'speech-to-speech' ? 'Speech-to-Speech' : 'Text-to-Speech'}
                </span>
                <Switch
                  checked={voiceMode === 'speech-to-speech'}
                  onCheckedChange={(checked) => setVoiceMode(checked ? 'speech-to-speech' : 'text-to-speech')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('mailto:cj@heybonita.ai', '_blank')}
                className="h-8"
              >
                <Mail className="h-4 w-4 mr-1" />
                Support
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Help
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}