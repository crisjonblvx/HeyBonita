import { db } from './db';
import { userActivity } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

// Voice emotion analysis using Web Audio API features and pattern recognition
export interface EmotionAnalysis {
  primary: EmotionType;
  secondary?: EmotionType;
  confidence: number;
  intensity: number; // 0-1 scale
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
}

export type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'frustrated' 
  | 'excited' 
  | 'calm' 
  | 'anxious' 
  | 'confident' 
  | 'tired' 
  | 'neutral';

export interface VoiceFeatures {
  pitch: number; // Hz
  volume: number; // dB
  speechRate: number; // words per minute
  pauseDuration: number; // ms
  voiceShake: number; // tremor indicator
  clarity: number; // pronunciation clarity
  duration: number; // total recording duration
}

export interface UIAdaptation {
  theme: 'supportive' | 'energetic' | 'calming' | 'professional' | 'empathetic';
  responseStyle: 'gentle' | 'enthusiastic' | 'measured' | 'direct' | 'compassionate';
  uiElements: {
    colors: string[];
    animations: 'minimal' | 'subtle' | 'dynamic';
    spacing: 'compact' | 'comfortable' | 'spacious';
    fontWeight: 'light' | 'normal' | 'medium';
  };
  bonitaPersonality: {
    tone: 'sweet-nurturing' | 'tough-love' | 'balanced';
    empathy: number; // 0-1 scale
    supportiveness: number; // 0-1 scale
  };
}

// Analyze voice features from audio buffer
export async function analyzeVoiceEmotion(
  audioBuffer: Buffer,
  userId: number,
  transcription?: string
): Promise<EmotionAnalysis> {
  try {
    // Extract basic voice features
    const features = await extractVoiceFeatures(audioBuffer);
    
    // Analyze emotional content from transcription
    const textualEmotion = transcription ? analyzeTextualEmotion(transcription) : null;
    
    // Combine acoustic and textual analysis
    const emotion = combineEmotionAnalysis(features, textualEmotion);
    
    // Store emotion data for learning
    await storeEmotionData(userId, emotion, features);
    
    return emotion;
  } catch (error) {
    console.error('Error analyzing voice emotion:', error);
    return {
      primary: 'neutral',
      confidence: 0.5,
      intensity: 0.5,
      valence: 0,
      arousal: 0.5
    };
  }
}

// Extract voice features from audio buffer
async function extractVoiceFeatures(audioBuffer: Buffer): Promise<VoiceFeatures> {
  // In a real implementation, this would use audio processing libraries
  // For now, we'll simulate feature extraction based on buffer properties
  
  const duration = audioBuffer.length / 16000; // Assuming 16kHz sample rate
  
  // Simulate voice feature extraction
  const features: VoiceFeatures = {
    pitch: 100 + Math.random() * 200, // 100-300 Hz range
    volume: -20 + Math.random() * 40, // -20 to 20 dB range
    speechRate: 120 + Math.random() * 60, // 120-180 WPM
    pauseDuration: Math.random() * 500, // 0-500ms pauses
    voiceShake: Math.random() * 0.3, // 0-0.3 tremor
    clarity: 0.7 + Math.random() * 0.3, // 0.7-1.0 clarity
    duration: duration
  };

  return features;
}

// Analyze emotional content from transcribed text
function analyzeTextualEmotion(text: string): Partial<EmotionAnalysis> {
  const lowerText = text.toLowerCase();
  
  // Emotion keywords and patterns
  const emotionPatterns = {
    happy: ['happy', 'great', 'awesome', 'excited', 'love', 'amazing', 'wonderful', 'fantastic'],
    sad: ['sad', 'depressed', 'down', 'upset', 'crying', 'terrible', 'awful', 'horrible'],
    angry: ['angry', 'mad', 'furious', 'pissed', 'frustrated', 'annoyed', 'hate'],
    anxious: ['worried', 'nervous', 'scared', 'anxious', 'stress', 'overwhelmed', 'panic'],
    confident: ['confident', 'sure', 'certain', 'determined', 'strong', 'capable'],
    tired: ['tired', 'exhausted', 'sleepy', 'drained', 'worn out', 'fatigue']
  };

  let maxScore = 0;
  let primaryEmotion: EmotionType = 'neutral';
  
  for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      primaryEmotion = emotion as EmotionType;
    }
  }

  // Calculate valence and arousal based on emotion
  const emotionMap = {
    happy: { valence: 0.8, arousal: 0.7 },
    excited: { valence: 0.9, arousal: 0.9 },
    sad: { valence: -0.7, arousal: 0.3 },
    angry: { valence: -0.8, arousal: 0.8 },
    anxious: { valence: -0.5, arousal: 0.7 },
    confident: { valence: 0.6, arousal: 0.6 },
    tired: { valence: -0.3, arousal: 0.2 },
    neutral: { valence: 0, arousal: 0.5 }
  };

  const mapping = emotionMap[primaryEmotion] || emotionMap.neutral;
  
  return {
    primary: primaryEmotion,
    confidence: Math.min(maxScore / 3, 1), // Normalize confidence
    valence: mapping.valence,
    arousal: mapping.arousal
  };
}

// Combine acoustic and textual emotion analysis
function combineEmotionAnalysis(
  voiceFeatures: VoiceFeatures,
  textualEmotion: Partial<EmotionAnalysis> | null
): EmotionAnalysis {
  // Analyze acoustic features for emotion
  const acousticEmotion = analyzeAcousticFeatures(voiceFeatures);
  
  if (!textualEmotion) {
    return acousticEmotion;
  }

  // Combine both analyses with weighted confidence
  const combinedConfidence = (acousticEmotion.confidence + (textualEmotion.confidence || 0)) / 2;
  
  // Prefer textual emotion if confidence is high, otherwise use acoustic
  const primaryEmotion = (textualEmotion.confidence || 0) > 0.7 
    ? textualEmotion.primary || acousticEmotion.primary
    : acousticEmotion.primary;

  return {
    primary: primaryEmotion,
    confidence: combinedConfidence,
    intensity: acousticEmotion.intensity,
    valence: textualEmotion.valence || acousticEmotion.valence,
    arousal: textualEmotion.arousal || acousticEmotion.arousal
  };
}

// Analyze acoustic features for emotional indicators
function analyzeAcousticFeatures(features: VoiceFeatures): EmotionAnalysis {
  let emotion: EmotionType = 'neutral';
  let intensity = 0.5;
  let valence = 0;
  let arousal = 0.5;

  // High pitch + fast speech = excited/anxious
  if (features.pitch > 200 && features.speechRate > 160) {
    emotion = features.volume > 0 ? 'excited' : 'anxious';
    arousal = 0.8;
    valence = features.volume > 0 ? 0.6 : -0.4;
    intensity = 0.7;
  }
  // Low pitch + slow speech = sad/tired
  else if (features.pitch < 150 && features.speechRate < 140) {
    emotion = features.pauseDuration > 300 ? 'sad' : 'tired';
    arousal = 0.3;
    valence = -0.5;
    intensity = 0.6;
  }
  // High volume + voice shake = angry
  else if (features.volume > 10 && features.voiceShake > 0.2) {
    emotion = 'angry';
    arousal = 0.9;
    valence = -0.7;
    intensity = 0.8;
  }
  // Stable features = confident
  else if (features.clarity > 0.9 && features.voiceShake < 0.1) {
    emotion = 'confident';
    arousal = 0.6;
    valence = 0.5;
    intensity = 0.6;
  }

  return {
    primary: emotion,
    confidence: 0.6, // Acoustic analysis is less certain than textual
    intensity,
    valence,
    arousal
  };
}

// Generate UI adaptations based on emotion
export function generateUIAdaptation(emotion: EmotionAnalysis): UIAdaptation {
  const adaptations: Record<EmotionType, UIAdaptation> = {
    happy: {
      theme: 'energetic',
      responseStyle: 'enthusiastic',
      uiElements: {
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4'], // Gold, coral, teal
        animations: 'dynamic',
        spacing: 'comfortable',
        fontWeight: 'medium'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.7, supportiveness: 0.8 }
    },
    sad: {
      theme: 'supportive',
      responseStyle: 'compassionate',
      uiElements: {
        colors: ['#B19CD9', '#C8E6C9', '#F8BBD9'], // Soft purple, mint, pink
        animations: 'subtle',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.9, supportiveness: 0.9 }
    },
    angry: {
      theme: 'calming',
      responseStyle: 'measured',
      uiElements: {
        colors: ['#81C784', '#90CAF9', '#FFCDD2'], // Soft green, blue, pink
        animations: 'minimal',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.8, supportiveness: 0.7 }
    },
    frustrated: {
      theme: 'supportive',
      responseStyle: 'gentle',
      uiElements: {
        colors: ['#A5D6A7', '#BBDEFB', '#F5F5F5'], // Light green, blue, gray
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'normal'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.8, supportiveness: 0.8 }
    },
    excited: {
      theme: 'energetic',
      responseStyle: 'enthusiastic',
      uiElements: {
        colors: ['#FF9800', '#E91E63', '#9C27B0'], // Orange, pink, purple
        animations: 'dynamic',
        spacing: 'compact',
        fontWeight: 'medium'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.7 }
    },
    anxious: {
      theme: 'calming',
      responseStyle: 'gentle',
      uiElements: {
        colors: ['#E8F5E8', '#E3F2FD', '#FFF3E0'], // Very soft green, blue, orange
        animations: 'minimal',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.9, supportiveness: 0.9 }
    },
    confident: {
      theme: 'professional',
      responseStyle: 'direct',
      uiElements: {
        colors: ['#2196F3', '#4CAF50', '#FF5722'], // Blue, green, orange
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'medium'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.6 }
    },
    tired: {
      theme: 'calming',
      responseStyle: 'gentle',
      uiElements: {
        colors: ['#E1BEE7', '#C5E1A5', '#DCEDC8'], // Soft purple, green, lime
        animations: 'minimal',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.7, supportiveness: 0.8 }
    },
    calm: {
      theme: 'professional',
      responseStyle: 'measured',
      uiElements: {
        colors: ['#607D8B', '#9E9E9E', '#BCAAA4'], // Blue gray, gray, brown
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'normal'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.6 }
    },
    neutral: {
      theme: 'professional',
      responseStyle: 'direct',
      uiElements: {
        colors: ['#3F51B5', '#009688', '#FF9800'], // Indigo, teal, orange
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'normal'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.6 }
    }
  };

  return adaptations[emotion.primary];
}

// Store emotion data for machine learning and user insights
async function storeEmotionData(
  userId: number,
  emotion: EmotionAnalysis,
  features: VoiceFeatures
): Promise<void> {
  try {
    await db.insert(userActivity).values({
      userId,
      activityType: 'voice_emotion',
      activityData: {
        emotion,
        voiceFeatures: features,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error storing emotion data:', error);
  }
}

// Get user's emotional patterns over time
export async function getUserEmotionalProfile(userId: number, days: number = 30): Promise<{
  dominantEmotions: Array<{ emotion: EmotionType; frequency: number }>;
  emotionalStability: number; // 0-1, higher = more stable
  averageValence: number; // -1 to 1
  averageArousal: number; // 0-1
  timePatterns: Array<{ hour: number; emotion: EmotionType; frequency: number }>;
}> {
  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const activities = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.timestamp));

    const emotionActivities = activities.filter(a => a.activityType === 'voice_emotion');
    
    if (emotionActivities.length === 0) {
      return {
        dominantEmotions: [],
        emotionalStability: 0.5,
        averageValence: 0,
        averageArousal: 0.5,
        timePatterns: []
      };
    }

    // Count emotion frequencies
    const emotionCounts = new Map<EmotionType, number>();
    let totalValence = 0;
    let totalArousal = 0;
    const hourlyEmotions = new Map<number, Map<EmotionType, number>>();

    emotionActivities.forEach(activity => {
      const emotionData = activity.activityData as any;
      const emotion = emotionData?.emotion?.primary;
      
      if (emotion) {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
        totalValence += emotionData.emotion.valence || 0;
        totalArousal += emotionData.emotion.arousal || 0.5;

        // Track hourly patterns
        const hour = new Date(activity.timestamp).getHours();
        if (!hourlyEmotions.has(hour)) {
          hourlyEmotions.set(hour, new Map());
        }
        const hourMap = hourlyEmotions.get(hour)!;
        hourMap.set(emotion, (hourMap.get(emotion) || 0) + 1);
      }
    });

    // Calculate dominant emotions
    const totalEmotions = emotionActivities.length;
    const dominantEmotions = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({
        emotion,
        frequency: count / totalEmotions
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Calculate emotional stability (inverse of variance)
    const avgFreq = 1 / emotionCounts.size;
    const variance = dominantEmotions.reduce((acc, { frequency }) => 
      acc + Math.pow(frequency - avgFreq, 2), 0) / dominantEmotions.length;
    const emotionalStability = Math.max(0, 1 - variance * 4); // Normalize to 0-1

    // Time patterns
    const timePatterns = Array.from(hourlyEmotions.entries()).flatMap(([hour, emotions]) =>
      Array.from(emotions.entries()).map(([emotion, count]) => ({
        hour,
        emotion,
        frequency: count / totalEmotions
      }))
    ).sort((a, b) => b.frequency - a.frequency);

    return {
      dominantEmotions,
      emotionalStability,
      averageValence: totalValence / emotionActivities.length,
      averageArousal: totalArousal / emotionActivities.length,
      timePatterns: timePatterns.slice(0, 20) // Top 20 patterns
    };
  } catch (error) {
    console.error('Error getting emotional profile:', error);
    return {
      dominantEmotions: [],
      emotionalStability: 0.5,
      averageValence: 0,
      averageArousal: 0.5,
      timePatterns: []
    };
  }
}