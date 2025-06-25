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

  // Template presets
  const templates = [
    {
      id: 'tiktok',
      name: 'TikTok Hook',
      topic: 'Create a viral TikTok hook about daily motivation',
      platform: 'TikTok (15-60s)',
      emoji: '🎬'
    },
    {
      id: 'youtube',
      name: 'YouTube Intro',
      topic: 'Create an engaging YouTube intro for a lifestyle channel',
      platform: 'YouTube Intro (15-90s)',
      emoji: '📺'
    },
    {
      id: 'instagram',
      name: 'Instagram Reel',
      topic: 'Create an Instagram Reel script about productivity tips',
      platform: 'Instagram Reel (15-90s)',
      emoji: '📱'
    }
  ];

  // Fetch scripts
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

  const handleTemplateClick = (template: typeof templates[0]) => {
    setTopic(template.topic);
    setPlatform(template.platform);
    toast({
      title: "Template Selected",
      description: `${template.name} template loaded!`,
    });
  };

  const copyScript = () => {
    if (currentScript) {
      navigator.clipboard.writeText(currentScript);
      toast({
        title: "Success",
        description: "Script copied to clipboard!",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Video Scripts</h2>
            <p className="text-muted-foreground">Create engaging video content with AI</p>
          </div>
          <Button variant="outline" onClick={copyScript} disabled={!currentScript}>
            <Download className="mr-2 h-4 w-4" />
            Export Script
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          
          {/* Quick Templates */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left space-y-2"
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="text-2xl">{template.emoji}</div>
                  <div>
                    <div className="font-semibold text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.platform}</div>
                  </div>
                </Button>
              ))}
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
                  <Button variant="outline" size="sm" onClick={copyScript}>
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

          {/* Previous Scripts */}
          {scripts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Previous Scripts</h3>
              <div className="space-y-4">
                {scripts.slice(0, 5).map((script: VideoScript) => (
                  <Card key={script.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentScript(script.script)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium truncate pr-4">{script.topic}</h4>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                          {script.platform}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {script.script.substring(0, 150)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}