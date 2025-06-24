import { useState, useEffect } from 'react';
import { BonitaChat } from '@/components/BonitaChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoScripts } from '@/components/VideoScripts';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
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
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ActiveTab = 'chat' | 'image' | 'video';
type ToneMode = 'sweet-nurturing' | 'tough-love';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [toneMode, setToneMode] = useState<ToneMode>('sweet-nurturing');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [userId] = useState(1); // Mock user ID - in real app this would come from auth

  const { language, setLanguage, t } = useLanguage();
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const { toast } = useToast();

  // Load user preferences
  useEffect(() => {
    const savedToneMode = localStorage.getItem('bonita-tone-mode') as ToneMode;
    const savedVoiceEnabled = localStorage.getItem('bonita-voice-enabled');
    
    if (savedToneMode) setToneMode(savedToneMode);
    if (savedVoiceEnabled) setVoiceEnabled(savedVoiceEnabled === 'true');
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('bonita-tone-mode', toneMode);
    localStorage.setItem('bonita-voice-enabled', voiceEnabled.toString());
  }, [toneMode, voiceEnabled]);

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
    setIsListening(!isListening);
    setVoiceEnabled(!voiceEnabled);
    toast({
      title: voiceEnabled ? "Voice Disabled" : "Voice Enabled",
      description: voiceEnabled ? "Voice features have been disabled." : "Voice features have been enabled.",
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chat':
        return <BonitaChat userId={userId} toneMode={toneMode} />;
      case 'image':
        return <ImageGenerator userId={userId} />;
      case 'video':
        return <VideoScripts userId={userId} toneMode={toneMode} />;
      default:
        return <BonitaChat userId={userId} toneMode={toneMode} />;
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
                <Avatar className="w-12 h-12 pulse-slow border-2 border-primary">
                  <AvatarImage src="/images/bonita-avatar.png" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
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
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Button
              variant={activeTab === 'chat' ? "default" : "ghost"}
              className="w-full justify-start nav-pill"
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="mr-3 h-5 w-5" />
              {t('chatWithBonita')}
            </Button>
            <Button
              variant={activeTab === 'image' ? "default" : "ghost"}
              className="w-full justify-start nav-pill"
              onClick={() => setActiveTab('image')}
            >
              <Image className="mr-3 h-5 w-5" />
              {t('imageGenerator')}
            </Button>
            <Button
              variant={activeTab === 'video' ? "default" : "ghost"}
              className="w-full justify-start nav-pill"
              onClick={() => setActiveTab('video')}
            >
              <Video className="mr-3 h-5 w-5" />
              {t('videoScripts')}
            </Button>
          </div>
          
          {/* Tone Mode Toggle */}
          <div className="mt-8 p-4 bg-muted rounded-xl">
            <h3 className="text-sm font-semibold mb-3">{t('bonitasTone')}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('sweetNurturing')}</span>
              <Switch
                checked={toneMode === 'tough-love'}
                onCheckedChange={handleToneModeChange}
              />
              <span className="text-sm text-muted-foreground">{t('toughLove')}</span>
            </div>
          </div>
        </nav>
        
        {/* Footer Controls */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-between items-center">
            <Button size="icon" variant="ghost" onClick={() => setShowSettings(true)}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setShowHelp(true)}>
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant={voiceEnabled ? "default" : "ghost"}
              onClick={handleVoiceToggle}
              className={isListening ? "animate-pulse" : ""}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
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
              <h4 className="text-sm font-semibold mb-3">{t('voiceSettings')}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('enableVoiceInput')}</span>
                  <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('textToSpeech')}</span>
                  <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
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
              <Button className="w-full">
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
