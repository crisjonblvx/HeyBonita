import { useState, useEffect } from 'react';
import { BonitaChat } from '@/components/BonitaChat';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoScripts } from '@/components/VideoScripts';
import { ReceiptsFolder } from '@/components/ReceiptsFolder';
import { GamificationPanel } from '@/components/Gamification';
import { ExportData } from '@/components/ExportData';
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
  FileText,
  Settings, 
  HelpCircle, 
  Mic, 
  Moon, 
  Sun,
  Mail,
  Trophy,
  Download,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define Bonita avatar URL
const bonitaAvatarUrl = "/images/bonita-logo-alpha.png";

type ActiveTab = 'chat' | 'image' | 'video' | 'receipts' | 'profile' | 'export';
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
  const [showHelp, setShowHelp] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'text-to-speech' | 'speech-to-speech'>('text-to-speech');
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

  // Fetch user data with better caching
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: [`/api/user/${userId}`],
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Logout function
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        // Redirect to login page
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
  }, [toneMode, responseMode, voiceMode, activeTab]);



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
        {!userId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground p-8">
              Loading...
            </div>
          </div>
        ) : (
          <>
            {/* Chat Tab */}
            <div className={`h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
              <BonitaChat userId={userId} toneMode={toneMode} responseMode={responseMode} voiceMode={voiceMode} />
            </div>
            
            {/* Images Tab */}
            <div className={`h-full ${activeTab === 'image' ? 'block' : 'hidden'}`}>
              <ImageGenerator userId={userId} />
            </div>
            
            {/* Video Scripts Tab */}
            <div className={`h-full ${activeTab === 'video' ? 'block' : 'hidden'}`}>
              <VideoScripts userId={userId} toneMode={toneMode} responseMode={responseMode} />
            </div>
            
            {/* Receipts Tab */}
            <div className={`h-full ${activeTab === 'receipts' ? 'block' : 'hidden'}`}>
              <ReceiptsFolder />
            </div>
            
            {/* Profile Tab */}
            <div className={`h-full ${activeTab === 'profile' ? 'block' : 'hidden'}`}>
              {userLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground p-8">
                    Loading profile...
                  </div>
                </div>
              ) : !user ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground p-8">
                    Unable to load profile
                  </div>
                </div>
              ) : (
                <GamificationPanel userId={userId} user={user} />
              )}
            </div>

            {/* Export Tab */}
            <div className={`h-full ${activeTab === 'export' ? 'block' : 'hidden'}`}>
              <ExportData userId={userId} />
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t bg-background">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
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
            onClick={() => setActiveTab('image')}
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
            onClick={() => setActiveTab('video')}
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
            onClick={() => setActiveTab('receipts')}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
              activeTab === 'receipts'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-5 w-5 mb-1" />
            Receipts
          </button>
          <button
            onClick={() => setActiveTab('profile')}
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
                onClick={() => setShowHelp(true)}
                className="h-8"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Help
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Getting Started</h4>
              <p className="text-sm text-muted-foreground">
                Bonita is your Digital Bronx Auntie - she's here to provide advice, create images, and write video scripts. 
                Switch between her "Sweet Nurturing" and "Tough Love" modes to get the style of guidance you need.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Chat:</strong> Have conversations in English, Spanish, Portuguese, or French</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Image className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Images:</strong> Generate custom images using AI technology</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Video className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Scripts:</strong> Create video scripts for TikTok, YouTube, and Instagram</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Mic className="h-4 w-4 text-primary mt-1" />
                  <span><strong>Voice:</strong> Use speech-to-speech for hands-free conversations</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Tips</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Try different tone modes to match your mood</li>
                <li>• Use presets for quick image and script generation</li>
                <li>• Toggle between quick and detailed responses</li>
                <li>• Download your generated images easily</li>
              </ul>
            </div>

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground">
                Need more help? Contact our support team:
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.open('mailto:cj@heybonita.ai', '_blank')}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}