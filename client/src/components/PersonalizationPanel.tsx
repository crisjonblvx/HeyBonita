import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Clock, 
  TrendingUp, 
  MessageSquare, 
  Palette, 
  Zap,
  Target,
  Save,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  responseStyle: 'quick' | 'detailed' | 'balanced';
  favoriteTopics: string[];
  customPrompts: any[];
}

interface PromptTemplate {
  id: number;
  name: string;
  description: string;
  template: string;
  category: string;
  usageCount: number;
}

export default function PersonalizationPanel() {
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptTemplate, setNewPromptTemplate] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('general');
  const [showNewPromptForm, setShowNewPromptForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/user/preferences'],
  });

  // Fetch user analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/user/analytics'],
  });

  // Fetch prompt templates
  const { data: promptTemplates = [] } = useQuery({
    queryKey: ['/api/user/prompt-templates'],
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      return await apiRequest('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({ title: 'Preferences updated successfully' });
    },
  });

  // Create prompt template mutation
  const createPromptMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      template: string;
      category: string;
    }) => {
      return await apiRequest('/api/user/prompt-templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/prompt-templates'] });
      setShowNewPromptForm(false);
      setNewPromptName('');
      setNewPromptTemplate('');
      toast({ title: 'Prompt template created successfully' });
    },
  });

  const handleResponseStyleChange = (style: 'quick' | 'detailed' | 'balanced') => {
    updatePreferencesMutation.mutate({ responseStyle: style });
  };

  const addFavoriteTopic = (topic: string) => {
    if (!topic.trim()) return;
    const updatedTopics = [...(preferences?.favoriteTopics || []), topic.trim()];
    updatePreferencesMutation.mutate({ favoriteTopics: updatedTopics });
  };

  const removeFavoriteTopic = (topicToRemove: string) => {
    const updatedTopics = preferences?.favoriteTopics.filter(topic => topic !== topicToRemove);
    updatePreferencesMutation.mutate({ favoriteTopics: updatedTopics });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Personalization Center</h1>
        <p className="text-muted-foreground">
          Customize Bonita to match your communication style and preferences
        </p>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Response Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Response Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={preferences?.responseStyle === 'quick' ? 'default' : 'outline'}
                  onClick={() => handleResponseStyleChange('quick')}
                  className="h-20 flex flex-col"
                >
                  <span className="font-semibold">Quick</span>
                  <span className="text-xs text-muted-foreground">1-2 sentences</span>
                </Button>
                <Button
                  variant={preferences?.responseStyle === 'balanced' ? 'default' : 'outline'}
                  onClick={() => handleResponseStyleChange('balanced')}
                  className="h-20 flex flex-col"
                >
                  <span className="font-semibold">Balanced</span>
                  <span className="text-xs text-muted-foreground">Adaptive length</span>
                </Button>
                <Button
                  variant={preferences?.responseStyle === 'detailed' ? 'default' : 'outline'}
                  onClick={() => handleResponseStyleChange('detailed')}
                  className="h-20 flex flex-col"
                >
                  <span className="font-semibold">Detailed</span>
                  <span className="text-xs text-muted-foreground">Full explanations</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Favorite Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {preferences?.favoriteTopics?.map((topic: string) => (
                    <Badge key={topic} variant="secondary" className="text-sm">
                      {topic}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => removeFavoriteTopic(topic)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a topic..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addFavoriteTopic(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addFavoriteTopic(input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics?.totalChats || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Chats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics?.avgSessionTime || '0m'}</p>
                    <p className="text-sm text-muted-foreground">Avg Session</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics?.streak || 0}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Brain className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics?.level || 1}</p>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Most Active Time</span>
                    <span>{analytics?.mostActiveTime || 'Evening'}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Voice Usage</span>
                    <span>{analytics?.voiceUsage || 0}%</span>
                  </div>
                  <Progress value={analytics?.voiceUsage || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quick Mode Usage</span>
                    <span>{analytics?.quickModeUsage || 0}%</span>
                  </div>
                  <Progress value={analytics?.quickModeUsage || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Custom Prompt Templates</h3>
            <Button onClick={() => setShowNewPromptForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {showNewPromptForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Template name"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                />
                <Select value={newPromptCategory} onValueChange={setNewPromptCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Template content (use {topic}, {tone}, etc. as placeholders)"
                  value={newPromptTemplate}
                  onChange={(e) => setNewPromptTemplate(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createPromptMutation.mutate({
                      name: newPromptName,
                      description: `Custom ${newPromptCategory} template`,
                      template: newPromptTemplate,
                      category: newPromptCategory
                    })}
                    disabled={!newPromptName || !newPromptTemplate || createPromptMutation.isPending}
                  >
                    Create Template
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPromptForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {promptTemplates.map((template: PromptTemplate) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="mr-2">
                        {template.category}
                      </Badge>
                      <Badge variant="secondary">
                        Used {template.usageCount} times
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <code className="text-sm">{template.template}</code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mobile Tab */}
        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="haptic">Haptic Feedback</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable vibration for button presses and interactions
                  </p>
                </div>
                <Switch id="haptic" />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="large-targets">Larger Touch Targets</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase button sizes for easier tapping
                  </p>
                </div>
                <Switch id="large-targets" />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reduced-motion">Reduced Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize motion effects for better performance
                  </p>
                </div>
                <Switch id="reduced-motion" />
              </div>

              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="voice-optimized">Voice-First Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Optimize interface for voice interactions
                  </p>
                </div>
                <Switch id="voice-optimized" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics?.touchAccuracy || 95}%</p>
                  <p className="text-sm text-muted-foreground">Touch Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics?.voiceSuccessRate || 88}%</p>
                  <p className="text-sm text-muted-foreground">Voice Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}