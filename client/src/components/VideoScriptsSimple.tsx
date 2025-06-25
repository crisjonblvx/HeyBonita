import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Wand2, Video, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoScript {
  id: number;
  topic: string;
  platform: string;
  script: string;
  createdAt: string;
}

interface VideoScriptsProps {
  userId: number;
  toneMode: 'sweet-nurturing' | 'tough-love';
  responseMode: 'quick' | 'detailed';
}

export function VideoScripts({ userId, toneMode, responseMode }: VideoScriptsProps) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('TikTok (15-60s)');
  const [currentScript, setCurrentScript] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test function for template clicks
  const testClick = (templateName: string) => {
    console.log('TEST CLICK:', templateName);
    alert(`Clicked: ${templateName}`);
  };

  // Fetch video scripts
  const { data: scripts = [] } = useQuery({
    queryKey: ['/api/scripts', userId],
    enabled: !!userId,
  });

  // Generate script mutation
  const generateScriptMutation = useMutation({
    mutationFn: async (scriptData: { 
      userId: number; 
      topic: string; 
      platform: string; 
      language: string;
      toneMode: string;
      responseMode: string;
    }) => {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate script');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/scripts', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements', userId] });
      
      if (data && data.script) {
        setCurrentScript(data.script);
        toast({
          title: "Script Generated!",
          description: "Your video script is ready!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate script",
        variant: "destructive",
      });
    },
  });

  const handleGenerateScript = () => {
    if (!topic.trim()) return;
    generateScriptMutation.mutate({
      userId,
      topic: topic.trim(),
      platform,
      language,
      toneMode,
      responseMode,
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid #ccc', backgroundColor: '#fff', flexShrink: 0 }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Video Scripts - DEBUG</h2>
        <p style={{ color: '#666', margin: '4px 0 0 0' }}>Testing click and scroll functionality</p>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f9f9f9' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          
          {/* Quick Templates - ULTRA SIMPLE TEST */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Presets (Ultra Simple)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => {
                  console.log('TikTok button clicked!');
                  alert('TikTok template clicked!');
                  setTopic('Create a viral TikTok hook about daily motivation');
                  setPlatform('TikTok (15-60s)');
                }}
                onMouseEnter={() => console.log('Mouse entered TikTok button')}
                onMouseLeave={() => console.log('Mouse left TikTok button')}
                style={{
                  width: '100%',
                  padding: '16px',
                  textAlign: 'left',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🎬 TikTok Hook - CLICK ME
              </button>
              <button 
                onClick={() => {
                  console.log('YouTube button clicked!');
                  alert('YouTube template clicked!');
                  setTopic('Create an engaging YouTube intro for a lifestyle channel');
                  setPlatform('YouTube Video (5-10min)');
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  textAlign: 'left',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📺 YouTube Intro - CLICK ME
              </button>
              <button 
                onClick={() => {
                  console.log('Instagram button clicked!');
                  alert('Instagram template clicked!');
                  setTopic('Create an Instagram Reel script about productivity tips');
                  setPlatform('Instagram Reel (15-90s)');
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  textAlign: 'left',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📱 Instagram Reel - CLICK ME
              </button>
            </div>
          </div>

          {/* Script Input */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What's your video about?
                </label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="I want to create a video about starting a side hustle..."
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div className="flex space-x-3">
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TikTok (15-60s)">TikTok (15-60s)</SelectItem>
                    <SelectItem value="Instagram Reel (15-90s)">Instagram Reel (15-90s)</SelectItem>
                    <SelectItem value="YouTube Short (60s)">YouTube Short (60s)</SelectItem>
                    <SelectItem value="YouTube Video (5-10min)">YouTube Video (5-10min)</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleGenerateScript}
                  disabled={!topic.trim() || generateScriptMutation.isPending}
                  className="flex-1"
                >
                  {generateScriptMutation.isPending ? (
                    <Video className="mr-2 h-4 w-4 animate-pulse" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Script
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Script Display */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Generated Script</h3>
                {currentScript && (
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(currentScript)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm leading-relaxed min-h-[200px] max-h-64 overflow-y-auto">
                {currentScript ? (
                  <div className="whitespace-pre-wrap">{currentScript}</div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {generateScriptMutation.isPending 
                      ? "Generating your script..." 
                      : "Your generated script will appear here"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Scrolling */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Scroll Test Content</h3>
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} style={{ 
                padding: '16px', 
                backgroundColor: '#e0e0e0', 
                borderRadius: '8px', 
                marginBottom: '8px',
                border: '1px solid #ccc'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  SCROLL TEST BLOCK {i + 1} - This content tests if scrolling works properly. 
                  If you can see this and scroll through all blocks, scrolling is working!
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}