import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Download, 
  Copy, 
  Wand2, 
  Video, 
  Youtube, 
  Instagram,
  FileText
} from 'lucide-react';
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

const scriptTemplates = [
  {
    id: 'tiktok-hook',
    name: 'TikTok Hook',
    description: 'Attention-grabbing opener',
    icon: Play,
    platform: 'TikTok (15-60s)'
  },
  {
    id: 'youtube-intro',
    name: 'YouTube Intro',
    description: 'Engaging video introduction',
    icon: Youtube,
    platform: 'YouTube Video (5-10min)'
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    description: 'Short-form content script',
    icon: Instagram,
    platform: 'Instagram Reel (15-90s)'
  }
];

export function VideoScripts({ userId, toneMode, responseMode }: VideoScriptsProps) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('TikTok (15-60s)');
  const [currentScript, setCurrentScript] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

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
    }) => {
      const response = await apiRequest('POST', '/api/scripts/generate', scriptData);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentScript(data.script);
      setTopic('');
      toast({
        title: "Success",
        description: "Video script generated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
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
    });
  };

  const handleTemplateClick = (template: typeof scriptTemplates[0]) => {
    setPlatform(template.platform);
    setTopic(`Create a ${template.name.toLowerCase()} script`);
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

  const exportScript = () => {
    if (currentScript) {
      const blob = new Blob([currentScript], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bonita-script-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Script exported successfully!",
      });
    }
  };

  const formatScript = (script: string) => {
    // Parse and format the script with proper timing markers and structure
    const lines = script.split('\n');
    return lines.map((line, index) => {
      if (line.includes('[') && line.includes(']')) {
        // Timing marker
        return (
          <div key={index} className="mb-2">
            <span className="font-bold text-primary">{line}</span>
          </div>
        );
      } else if (line.trim()) {
        // Content line
        return (
          <div key={index} className="mb-2">
            <p className="text-foreground leading-relaxed">{line}</p>
          </div>
        );
      }
      return <div key={index} className="mb-2"></div>;
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('videoHeader')}</h2>
            <p className="text-muted-foreground">{t('videoSubtitle')}</p>
          </div>
          <Button variant="outline" onClick={exportScript} disabled={!currentScript}>
            <Download className="mr-2 h-4 w-4" />
            {t('exportScript')}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Script Templates */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('scriptTemplates')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scriptTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="p-4 h-auto text-left flex flex-col items-start space-y-2"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <IconComponent className="h-6 w-6 mb-2" />
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Generated Script Display */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('generatedScript')}</h3>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                  {currentScript ? (
                    <div className="space-y-2">
                      {formatScript(currentScript)}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {generateScriptMutation.isPending 
                        ? "Generating your script..." 
                        : "Your generated script will appear here"}
                    </div>
                  )}
                </div>
                {currentScript && (
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Platform:</span> {platform}
                    </div>
                    <Button onClick={copyScript}>
                      <Copy className="mr-2 h-4 w-4" />
                      {t('copyScript')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Script Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('whatsVideoAbout')}
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
                {t('generateScript')}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
