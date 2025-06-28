import { db } from './db';
import { userActivity, users } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

// Mobile-specific user experience optimizations
export interface MobilePreferences {
  hapticFeedback: boolean;
  reducedAnimations: boolean;
  largerTouchTargets: boolean;
  voiceOptimized: boolean;
  offlineMode: boolean;
  dataSaverMode: boolean;
}

// Detect mobile device characteristics
export function getMobileDeviceInfo(userAgent: string): {
  isMobile: boolean;
  isTablet: boolean;
  platform: 'ios' | 'android' | 'other';
  capabilities: {
    touchScreen: boolean;
    hapticFeedback: boolean;
    speechRecognition: boolean;
    accelerometer: boolean;
  };
} {
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(userAgent);
  const isTablet = /iPad|Android.*Tablet|PlayBook|Silk/i.test(userAgent);
  
  let platform: 'ios' | 'android' | 'other' = 'other';
  if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'ios';
  else if (/Android/i.test(userAgent)) platform = 'android';

  return {
    isMobile,
    isTablet,
    platform,
    capabilities: {
      touchScreen: isMobile || isTablet,
      hapticFeedback: platform === 'ios' || platform === 'android',
      speechRecognition: true, // Most modern browsers support this
      accelerometer: isMobile
    }
  };
}

// Track mobile interaction patterns
export async function trackMobileInteraction(
  userId: number,
  interactionType: 'touch' | 'voice' | 'gesture' | 'orientation_change',
  context: {
    duration?: number;
    success?: boolean;
    errorReason?: string;
    deviceInfo?: any;
  }
): Promise<void> {
  try {
    await db.insert(userActivity).values({
      userId,
      activityType: 'mobile_interaction',
      activityData: {
        interactionType,
        context,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error tracking mobile interaction:', error);
  }
}

// Optimize content for mobile consumption
export function optimizeContentForMobile(content: string, platform: 'ios' | 'android' | 'other'): {
  optimizedContent: string;
  readingTime: number;
  wordCount: number;
  suggestions: string[];
} {
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute on mobile

  let optimizedContent = content;
  const suggestions: string[] = [];

  // Mobile-specific optimizations
  if (wordCount > 150) {
    suggestions.push("Consider breaking this into shorter paragraphs for mobile reading");
  }

  if (content.includes('\n\n')) {
    // Already has paragraph breaks
  } else if (content.length > 300) {
    // Add paragraph breaks for long content
    const sentences = content.split('. ');
    if (sentences.length > 3) {
      optimizedContent = sentences.reduce((acc, sentence, index) => {
        if (index > 0 && index % 2 === 0) {
          return acc + '.\n\n' + sentence;
        }
        return acc + (index > 0 ? '. ' : '') + sentence;
      }, '');
      suggestions.push("Added paragraph breaks for better mobile readability");
    }
  }

  // Platform-specific suggestions
  if (platform === 'ios') {
    suggestions.push("Consider using iOS-specific haptic feedback for interactions");
  } else if (platform === 'android') {
    suggestions.push("Consider using Android-specific vibration patterns");
  }

  return {
    optimizedContent,
    readingTime,
    wordCount,
    suggestions
  };
}

// Generate mobile-optimized voice prompts
export function generateVoicePrompts(context: 'chat' | 'image' | 'script'): {
  startPrompt: string;
  errorPrompt: string;
  successPrompt: string;
  tips: string[];
} {
  const prompts = {
    chat: {
      startPrompt: "I'm listening. What would you like to talk about?",
      errorPrompt: "Sorry, I didn't catch that. Try speaking a bit slower.",
      successPrompt: "Got it! Let me think about that.",
      tips: [
        "Speak clearly and at a normal pace",
        "Find a quiet environment",
        "Hold your device 6-12 inches from your mouth",
        "Pause briefly between sentences"
      ]
    },
    image: {
      startPrompt: "Describe the image you'd like me to create.",
      errorPrompt: "Could you repeat your image description?",
      successPrompt: "Creating your image now!",
      tips: [
        "Be descriptive about style, colors, and mood",
        "Mention specific details you want included",
        "Specify the art style if you have a preference"
      ]
    },
    script: {
      startPrompt: "Tell me about the video script you need.",
      errorPrompt: "I need more details about your script. Try again.",
      successPrompt: "Perfect! I'll create that script for you.",
      tips: [
        "Mention the platform (TikTok, YouTube, etc.)",
        "Specify your target audience",
        "Tell me the main topic or goal"
      ]
    }
  };

  return prompts[context];
}

// Analyze mobile usage patterns
export async function analyzeMobileUsage(userId: number, days: number = 30): Promise<{
  totalSessions: number;
  averageSessionDuration: number;
  preferredFeatures: string[];
  peakUsageHours: number[];
  voiceUsagePercentage: number;
  touchAccuracy: number;
}> {
  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const activities = await db
      .select()
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        gte(userActivity.timestamp, cutoffDate)
      ))
      .orderBy(desc(userActivity.timestamp));

    const mobileActivities = activities.filter(a => 
      a.activityType === 'mobile_interaction'
    );

    // Calculate metrics
    const totalSessions = new Set(
      mobileActivities.map(a => 
        new Date(a.timestamp).toDateString()
      )
    ).size;

    const sessionDurations = mobileActivities
      .filter(a => a.activityData?.context?.duration)
      .map(a => a.activityData.context.duration);
    
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    // Analyze preferred features
    const featureUsage = new Map<string, number>();
    mobileActivities.forEach(activity => {
      const feature = activity.activityData?.interactionType;
      if (feature) {
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      }
    });

    const preferredFeatures = Array.from(featureUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([feature]) => feature);

    // Calculate peak usage hours
    const hourUsage = new Array(24).fill(0);
    mobileActivities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourUsage[hour]++;
    });

    const peakUsageHours = hourUsage
      .map((usage, hour) => ({ hour, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3)
      .map(({ hour }) => hour);

    // Voice usage percentage
    const voiceActivities = mobileActivities.filter(a => 
      a.activityData?.interactionType === 'voice'
    ).length;
    const voiceUsagePercentage = mobileActivities.length > 0
      ? (voiceActivities / mobileActivities.length) * 100
      : 0;

    // Touch accuracy (successful touches vs total)
    const touchActivities = mobileActivities.filter(a => 
      a.activityData?.interactionType === 'touch'
    );
    const successfulTouches = touchActivities.filter(a => 
      a.activityData?.context?.success === true
    ).length;
    const touchAccuracy = touchActivities.length > 0
      ? (successfulTouches / touchActivities.length) * 100
      : 100;

    return {
      totalSessions,
      averageSessionDuration,
      preferredFeatures,
      peakUsageHours,
      voiceUsagePercentage,
      touchAccuracy
    };
  } catch (error) {
    console.error('Error analyzing mobile usage:', error);
    return {
      totalSessions: 0,
      averageSessionDuration: 0,
      preferredFeatures: [],
      peakUsageHours: [],
      voiceUsagePercentage: 0,
      touchAccuracy: 100
    };
  }
}

// Generate mobile-specific recommendations
export function generateMobileRecommendations(
  usageAnalysis: any,
  deviceInfo: any
): string[] {
  const recommendations: string[] = [];

  if (usageAnalysis.voiceUsagePercentage < 20 && deviceInfo.capabilities.speechRecognition) {
    recommendations.push("Try using voice input for faster interactions");
  }

  if (usageAnalysis.touchAccuracy < 85) {
    recommendations.push("Enable larger touch targets in settings for easier navigation");
  }

  if (usageAnalysis.averageSessionDuration > 300) { // 5 minutes
    recommendations.push("Take breaks during longer sessions to reduce eye strain");
  }

  if (deviceInfo.capabilities.hapticFeedback) {
    recommendations.push("Enable haptic feedback for better interaction confirmation");
  }

  if (usageAnalysis.preferredFeatures.includes('voice')) {
    recommendations.push("Consider using hands-free mode for voice-first interactions");
  }

  return recommendations;
}