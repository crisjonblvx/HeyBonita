import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Clock, 
  Zap, 
  BarChart3,
  Palette,
  Settings,
  Eye
} from 'lucide-react';
import { useEmotion, EmotionIndicator } from './EmotionAdaptiveUI';

interface EmotionalProfile {
  dominantEmotions: Array<{ emotion: string; frequency: number }>;
  emotionalStability: number;
  averageValence: number;
  averageArousal: number;
  timePatterns: Array<{ hour: number; emotion: string; frequency: number }>;
}

export default function EmotionDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState(30);
  const { currentEmotion, uiAdaptation, resetToDefault } = useEmotion();

  // Fetch emotional profile
  const { data: emotionalProfile } = useQuery({
    queryKey: ['/api/voice/emotional-profile', selectedTimeRange],
    queryParams: { days: selectedTimeRange },
  });

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: '#FFD700',
      excited: '#FF9800',
      confident: '#2196F3',
      calm: '#81C784',
      neutral: '#9E9E9E',
      tired: '#E1BEE7',
      sad: '#B19CD9',
      anxious: '#E8F5E8',
      frustrated: '#A5D6A7',
      angry: '#FF6B6B'
    };
    return colors[emotion] || '#9E9E9E';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: Record<string, string> = {
      happy: '😊',
      excited: '🤩',
      confident: '😎',
      calm: '😌',
      neutral: '😐',
      tired: '😴',
      sad: '😢',
      anxious: '😰',
      frustrated: '😤',
      angry: '😠'
    };
    return emojis[emotion] || '😐';
  };

  const getStabilityDescription = (stability: number) => {
    if (stability > 0.8) return { text: 'Very Stable', color: 'text-green-600' };
    if (stability > 0.6) return { text: 'Stable', color: 'text-blue-600' };
    if (stability > 0.4) return { text: 'Moderate', color: 'text-yellow-600' };
    if (stability > 0.2) return { text: 'Variable', color: 'text-orange-600' };
    return { text: 'Highly Variable', color: 'text-red-600' };
  };

  const getValenceDescription = (valence: number) => {
    if (valence > 0.3) return { text: 'Positive', color: 'text-green-600' };
    if (valence > -0.3) return { text: 'Neutral', color: 'text-gray-600' };
    return { text: 'Negative', color: 'text-red-600' };
  };

  const getArousalDescription = (arousal: number) => {
    if (arousal > 0.7) return { text: 'High Energy', color: 'text-orange-600' };
    if (arousal > 0.3) return { text: 'Moderate Energy', color: 'text-blue-600' };
    return { text: 'Low Energy', color: 'text-purple-600' };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Voice Emotion Dashboard</h1>
        <p className="text-muted-foreground">
          Track how Bonita adapts to your emotional state through voice analysis
        </p>
      </div>

      {/* Current Emotion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Current Emotion State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <EmotionIndicator className="text-sm" />
              {currentEmotion && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getEmotionEmoji(currentEmotion.primary)}</span>
                  <div>
                    <p className="font-medium capitalize">{currentEmotion.primary}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(currentEmotion.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {uiAdaptation && (
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">
                  {uiAdaptation.theme} theme
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Bonita is using {uiAdaptation.responseStyle} responses
                </p>
              </div>
            )}
          </div>

          {currentEmotion && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Emotional Valence</p>
                <Progress 
                  value={((currentEmotion.valence + 1) / 2) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {currentEmotion.valence > 0 ? 'Positive' : 'Negative'} ({currentEmotion.valence.toFixed(2)})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Energy Level</p>
                <Progress 
                  value={currentEmotion.arousal * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {currentEmotion.arousal > 0.5 ? 'High' : 'Low'} energy ({currentEmotion.arousal.toFixed(2)})
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={resetToDefault}>
              <Settings className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTimeRange.toString()} onValueChange={(value) => setSelectedTimeRange(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="7">7 Days</TabsTrigger>
          <TabsTrigger value="30">30 Days</TabsTrigger>
          <TabsTrigger value="90">90 Days</TabsTrigger>
          <TabsTrigger value="365">1 Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeRange.toString()} className="space-y-6">
          {/* Emotional Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {emotionalProfile?.emotionalStability ? 
                        Math.round(emotionalProfile.emotionalStability * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Emotional Stability</p>
                  </div>
                </div>
                {emotionalProfile?.emotionalStability && (
                  <p className={`text-xs mt-2 ${getStabilityDescription(emotionalProfile.emotionalStability).color}`}>
                    {getStabilityDescription(emotionalProfile.emotionalStability).text}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {emotionalProfile?.averageValence ? 
                        emotionalProfile.averageValence.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Mood</p>
                  </div>
                </div>
                {emotionalProfile?.averageValence !== undefined && (
                  <p className={`text-xs mt-2 ${getValenceDescription(emotionalProfile.averageValence).color}`}>
                    {getValenceDescription(emotionalProfile.averageValence).text}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {emotionalProfile?.averageArousal ? 
                        emotionalProfile.averageArousal.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Energy Level</p>
                  </div>
                </div>
                {emotionalProfile?.averageArousal !== undefined && (
                  <p className={`text-xs mt-2 ${getArousalDescription(emotionalProfile.averageArousal).color}`}>
                    {getArousalDescription(emotionalProfile.averageArousal).text}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dominant Emotions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Emotion Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionalProfile?.dominantEmotions?.slice(0, 5).map((emotion, index) => (
                  <motion.div
                    key={emotion.emotion}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <span className="text-2xl">{getEmotionEmoji(emotion.emotion)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium capitalize">{emotion.emotion}</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(emotion.frequency * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={emotion.frequency * 100} 
                        className="h-2"
                        style={{
                          '--progress-foreground': getEmotionColor(emotion.emotion)
                        } as React.CSSProperties}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daily Emotion Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourPatterns = emotionalProfile?.timePatterns?.filter(p => p.hour === hour) || [];
                  const dominantPattern = hourPatterns.sort((a, b) => b.frequency - a.frequency)[0];
                  
                  return (
                    <div
                      key={hour}
                      className="text-center p-2 rounded border"
                      style={{
                        backgroundColor: dominantPattern ? 
                          `${getEmotionColor(dominantPattern.emotion)}20` : 
                          'transparent',
                        borderColor: dominantPattern ? 
                          `${getEmotionColor(dominantPattern.emotion)}40` : 
                          'var(--border)'
                      }}
                    >
                      <div className="text-xs font-medium">{hour}:00</div>
                      {dominantPattern && (
                        <div className="text-lg">{getEmotionEmoji(dominantPattern.emotion)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Your most common emotions at different times of day
              </p>
            </CardContent>
          </Card>

          {/* UI Adaptation Preview */}
          {uiAdaptation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Current UI Adaptation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Color Scheme</h4>
                    <div className="flex gap-2">
                      {uiAdaptation.uiElements.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Bonita's Personality</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tone:</span>
                        <Badge variant="outline">{uiAdaptation.bonitaPersonality.tone}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Empathy:</span>
                        <div className="flex-1 mx-2">
                          <Progress value={uiAdaptation.bonitaPersonality.empathy * 100} className="h-1" />
                        </div>
                        <span className="text-xs">{Math.round(uiAdaptation.bonitaPersonality.empathy * 100)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Support:</span>
                        <div className="flex-1 mx-2">
                          <Progress value={uiAdaptation.bonitaPersonality.supportiveness * 100} className="h-1" />
                        </div>
                        <span className="text-xs">{Math.round(uiAdaptation.bonitaPersonality.supportiveness * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <Eye className="h-4 w-4 inline mr-2" />
                    Bonita is currently using <strong>{uiAdaptation.responseStyle}</strong> responses 
                    with <strong>{uiAdaptation.uiElements.animations}</strong> animations 
                    and <strong>{uiAdaptation.uiElements.spacing}</strong> spacing to match your emotional state.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}