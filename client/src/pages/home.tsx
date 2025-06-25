import { useState, useEffect } from 'react';
import { BonitaChat } from '@/components/BonitaChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoScripts } from '@/components/VideoScripts';
import { GamificationPanel } from '@/components/Gamification';
import { ExportData } from '@/components/ExportData';
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
  const [userId] = useState(1); // Mock user ID - in real app this would come from auth

  const { language, setLanguage, t } = useLanguage();
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const { toast } = useToast();

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
    switch (activeTab) {
      case 'chat':
        return <BonitaChat userId={userId} toneMode={toneMode} responseMode={responseMode} voiceMode={voiceMode} />;
      case 'image':
        return <ImageGenerator userId={userId} />;
      case 'video':
        return <VideoScripts userId={userId} toneMode={toneMode} responseMode={responseMode} />;
      case 'profile':
        if (userLoading || !user) {
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground p-8">
                {userLoading ? 'Loading profile...' : 'Creating profile...'}
              </div>
            </div>
          );
        }
        return <GamificationPanel userId={userId} user={user} />;
      default:
        return <BonitaChat userId={userId} toneMode={toneMode} responseMode={responseMode} voiceMode={voiceMode} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-muted/30 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 pulse-slow border-2 border-primary rounded-full flex items-center justify-center bg-background">
                  <img 
                    src="/images/bonita-logo-alpha.png" 
                    alt="Bonita AI" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Bonita AI</h1>
                <p className="text-sm text-muted-foreground">Digital Bronx Auntie</p>
              </div>
            </div>
            
            <Button size="icon" variant="ghost" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Language Selector */}
          <div className="flex space-x-1 bg-muted rounded-full p-1">
            {['en', 'es', 'pt', 'fr'].map((lang) => (
              <Button
                key={lang}
                size="sm"
                variant={language === lang ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => handleLanguageChange(lang as any)}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            <Button
              variant={activeTab === 'chat' ? "default" : "ghost"}
              className="w-full justify-start h-9 text-sm"
              onClick={() => setActiveTab('chat')}
              title="Chat with Bonita"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'image' ? "default" : "ghost"}
              className="w-full justify-start h-9 text-sm"
              onClick={() => setActiveTab('image')}
              title="Generate Images"
            >
              <Image className="mr-2 h-4 w-4" />
              Images
            </Button>
            <Button
              variant={activeTab === 'video' ? "default" : "ghost"}
              className="w-full justify-start h-9 text-sm"
              onClick={() => setActiveTab('video')}
              title="Create Scripts"
            >
              <Video className="mr-2 h-4 w-4" />
              Scripts
            </Button>
            <Button
              variant={activeTab === 'profile' ? "default" : "ghost"}
              className="w-full justify-start h-9 text-sm"
              onClick={() => setActiveTab('profile')}
              title="View Profile & Achievements"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </div>
          
          {/* Control Panel */}
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Settings</h3>
            
            {/* Tone Mode */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Heart className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs truncate">Tone</span>
              </div>
              <div className="flex bg-muted-foreground/10 rounded-lg p-0.5 flex-shrink-0">
                <button
                  onClick={() => setToneMode('sweet-nurturing')}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    toneMode === 'sweet-nurturing' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Sweet & Nurturing"
                >
                  Sweet
                </button>
                <button
                  onClick={() => setToneMode('tough-love')}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    toneMode === 'tough-love' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Tough Love"
                >
                  Tough
                </button>
              </div>
            </div>

            {/* Response Mode */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs truncate">Speed</span>
              </div>
              <div className="flex bg-muted-foreground/10 rounded-lg p-0.5 flex-shrink-0">
                <button
                  onClick={() => setResponseMode('detailed')}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    responseMode === 'detailed' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Detailed & Poetic"
                >
                  Deep
                </button>
                <button
                  onClick={() => setResponseMode('quick')}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    responseMode === 'quick' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Quick & Real"
                >
                  Quick
                </button>
              </div>
            </div>

            {/* Voice Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Headphones className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs truncate">Voice</span>
              </div>
              <div className="flex bg-muted-foreground/10 rounded-lg p-0.5 flex-shrink-0">
                <button
                  onClick={() => setVoiceMode('text-to-speech')}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    voiceMode === 'text-to-speech' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Text-to-Speech"
                >
                  TTS
                </button>
                <button
                  onClick={() => setVoiceMode('speech-to-speech')}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    voiceMode === 'speech-to-speech' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Speech-to-Speech"
                >
                  STS
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Footer Controls */}
        <div className="p-3 border-t border-border">
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)} title="Settings" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowHelp(true)} title="Help" className="h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleTheme} title="Toggle Theme" className="h-8 w-8 p-0">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
                    onClick={() => handleColorSchemeChange(scheme.name as any)}
                  />
                ))}
              </div>
            </div>
            
            {/* Voice Settings */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Voice Mode</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Text-to-Speech</span>
                  <Switch 
                    checked={voiceMode === 'text-to-speech'} 
                    onCheckedChange={(checked) => setVoiceMode(checked ? 'text-to-speech' : 'speech-to-speech')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Speech-to-Speech</span>
                  <Switch 
                    checked={voiceMode === 'speech-to-speech'} 
                    onCheckedChange={(checked) => setVoiceMode(checked ? 'speech-to-speech' : 'text-to-speech')} 
                  />
                </div>
              </div>
            </div>
            
            {/* Data Settings */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{t('dataPrivacy')}</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  {t('exportChatHistory')}
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('clearAllData')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('helpSupport')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('gettingStarted')}</h4>
              <p className="text-sm text-muted-foreground">
                Bonita is your Digital Bronx Auntie - she's here to provide advice, create images, and write video scripts. 
                Switch between her "Sweet Nurturing" and "Tough Love" modes to get the style of guidance you need.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('features')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Chat:</strong> Have conversations in English, Spanish, Portuguese, or French</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Image className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Images:</strong> Generate custom images using DALL-E 3 technology</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Video className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Scripts:</strong> Create engaging video scripts for social media</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Mic className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Voice:</strong> Use voice input and text-to-speech features</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('tipsForBetter')}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Be specific in your image prompts for better results</li>
                <li>• Use the preset templates for quick script generation</li>
                <li>• Try different color schemes to personalize your experience</li>
                <li>• Switch language modes to practice multilingual conversations</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button 
                className="w-full"
                onClick={() => window.open('mailto:cj@heybonita.ai?subject=Bonita AI Support Request', '_blank')}
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
