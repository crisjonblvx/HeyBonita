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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Video Scripts</h2>
            <p className="text-muted-foreground">Create engaging video content with AI</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          
          {/* Quick Templates - TEST VERSION */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Presets (Test)</h3>
            <div className="space-y-2">
              <button 
                onClick={() => testClick('TikTok')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                🎬 TikTok Hook - Test Button
              </button>
              <button 
                onClick={() => testClick('YouTube')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                📺 YouTube Intro - Test Button  
              </button>
              <button 
                onClick={() => testClick('Instagram')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                📱 Instagram Reel - Test Button
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scroll Test Content</h3>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <p>Test content block {i + 1} - This content is here to test scrolling functionality.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}