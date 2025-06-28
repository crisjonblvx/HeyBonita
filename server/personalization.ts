import { db } from './db';
import { users, userActivity, promptTemplates } from '@shared/schema';
import { eq, desc, count, and } from 'drizzle-orm';

// Track user activity for personalization
export async function trackUserActivity(
  userId: number,
  activityType: 'chat' | 'image' | 'script' | 'search',
  activityData: any
): Promise<void> {
  try {
    await db.insert(userActivity).values({
      userId,
      activityType,
      activityData,
    });
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
}

// Analyze user preferences based on activity
export async function analyzeUserPreferences(userId: number): Promise<{
  favoriteTopics: string[];
  preferredResponseStyle: 'quick' | 'detailed' | 'balanced';
  mostActiveTimeOfDay: string;
  commonQuestionTypes: string[];
}> {
  try {
    // Get user activities
    const activities = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.timestamp))
      .limit(100);

    // Analyze topics from chat activities
    const chatActivities = activities.filter(a => a.activityType === 'chat');
    const favoriteTopics = extractTopicsFromActivities(chatActivities);

    // Determine preferred response style based on interaction patterns
    const responseStyle = determineResponseStyle(chatActivities);

    // Calculate most active time of day
    const mostActiveTimeOfDay = calculateMostActiveTime(activities);

    // Identify common question types
    const commonQuestionTypes = identifyQuestionTypes(chatActivities);

    return {
      favoriteTopics,
      preferredResponseStyle,
      mostActiveTimeOfDay,
      commonQuestionTypes
    };
  } catch (error) {
    console.error('Error analyzing user preferences:', error);
    return {
      favoriteTopics: [],
      preferredResponseStyle: 'balanced',
      mostActiveTimeOfDay: 'afternoon',
      commonQuestionTypes: []
    };
  }
}

// Update user preferences in the database
export async function updateUserPreferences(
  userId: number,
  preferences: {
    responseStyle?: 'quick' | 'detailed' | 'balanced';
    favoriteTopics?: string[];
  }
): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({
        responseStyle: preferences.responseStyle,
        favoriteTopics: preferences.favoriteTopics ? JSON.stringify(preferences.favoriteTopics) : undefined
      })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
}

// Create custom prompt template
export async function createPromptTemplate(
  userId: number,
  name: string,
  description: string,
  template: string,
  category: string = 'general'
): Promise<any> {
  try {
    const [promptTemplate] = await db
      .insert(promptTemplates)
      .values({
        userId,
        name,
        description,
        template,
        category,
        isPublic: false,
        usageCount: 0
      })
      .returning();

    return promptTemplate;
  } catch (error) {
    console.error('Error creating prompt template:', error);
    throw error;
  }
}

// Get user's custom prompt templates
export async function getUserPromptTemplates(userId: number): Promise<any[]> {
  try {
    return await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.userId, userId))
      .orderBy(desc(promptTemplates.usageCount));
  } catch (error) {
    console.error('Error getting user prompt templates:', error);
    return [];
  }
}

// Use a prompt template (increment usage count)
export async function usePromptTemplate(templateId: number, userId: number): Promise<any | null> {
  try {
    // Get template
    const [template] = await db
      .select()
      .from(promptTemplates)
      .where(and(
        eq(promptTemplates.id, templateId),
        eq(promptTemplates.userId, userId)
      ));

    if (!template) return null;

    // Increment usage count
    await db
      .update(promptTemplates)
      .set({ usageCount: template.usageCount + 1 })
      .where(eq(promptTemplates.id, templateId));

    return { ...template, usageCount: template.usageCount + 1 };
  } catch (error) {
    console.error('Error using prompt template:', error);
    return null;
  }
}

// Helper functions for analysis
function extractTopicsFromActivities(activities: any[]): string[] {
  const topics = new Map<string, number>();
  
  activities.forEach(activity => {
    if (activity.activityData?.message) {
      const message = activity.activityData.message.toLowerCase();
      
      // Simple keyword extraction (in production, use NLP)
      const keywords = [
        'business', 'marketing', 'content', 'writing', 'creativity',
        'health', 'fitness', 'relationships', 'career', 'goals',
        'music', 'art', 'technology', 'learning', 'motivation'
      ];
      
      keywords.forEach(keyword => {
        if (message.includes(keyword)) {
          topics.set(keyword, (topics.get(keyword) || 0) + 1);
        }
      });
    }
  });

  return Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

function determineResponseStyle(activities: any[]): 'quick' | 'detailed' | 'balanced' {
  if (activities.length < 5) return 'balanced';
  
  // Simple heuristic based on activity patterns
  const quickResponses = activities.filter(a => 
    a.activityData?.responseMode === 'quick'
  ).length;
  
  const detailedResponses = activities.filter(a => 
    a.activityData?.responseMode === 'detailed'
  ).length;

  if (quickResponses > detailedResponses * 1.5) return 'quick';
  if (detailedResponses > quickResponses * 1.5) return 'detailed';
  return 'balanced';
}

function calculateMostActiveTime(activities: any[]): string {
  const timeSlots = {
    morning: 0,   // 6-12
    afternoon: 0, // 12-18
    evening: 0,   // 18-22
    night: 0      // 22-6
  };

  activities.forEach(activity => {
    const hour = new Date(activity.timestamp).getHours();
    if (hour >= 6 && hour < 12) timeSlots.morning++;
    else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
    else if (hour >= 18 && hour < 22) timeSlots.evening++;
    else timeSlots.night++;
  });

  return Object.entries(timeSlots)
    .sort((a, b) => b[1] - a[1])[0][0];
}

function identifyQuestionTypes(activities: any[]): string[] {
  const types = new Map<string, number>();
  
  activities.forEach(activity => {
    if (activity.activityData?.message) {
      const message = activity.activityData.message.toLowerCase();
      
      if (message.includes('how to') || message.includes('how do')) {
        types.set('How-to questions', (types.get('How-to questions') || 0) + 1);
      }
      if (message.includes('what is') || message.includes('what are')) {
        types.set('Definition questions', (types.get('Definition questions') || 0) + 1);
      }
      if (message.includes('should i') || message.includes('advice')) {
        types.set('Advice seeking', (types.get('Advice seeking') || 0) + 1);
      }
      if (message.includes('create') || message.includes('generate')) {
        types.set('Content creation', (types.get('Content creation') || 0) + 1);
      }
    }
  });

  return Array.from(types.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);
}