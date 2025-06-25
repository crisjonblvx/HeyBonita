// Export service for user data
import { storage } from './storage.js';
import { format } from 'date-fns';

export interface ExportData {
  user: {
    username: string;
    email: string;
    totalPoints: number;
    currentLevel: number;
    joinDate: string;
  };
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  generatedImages: Array<{
    prompt: string;
    imageUrl: string;
    createdAt: string;
  }>;
  videoScripts: Array<{
    topic: string;
    platform: string;
    script: string;
    createdAt: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    pointsAwarded: number;
    unlockedAt: string;
  }>;
  exportDate: string;
}

export async function exportUserData(userId: number): Promise<ExportData> {
  try {
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all user content
    const [chatMessages, generatedImages, videoScripts, achievements] = await Promise.all([
      storage.getChatMessages(userId, 1000), // Export up to 1000 messages
      storage.getGeneratedImages(userId, 500), // Export up to 500 images
      storage.getVideoScripts(userId, 200), // Export up to 200 scripts
      storage.getUserAchievements(userId)
    ]);

    return {
      user: {
        username: user.username,
        email: user.email || '',
        totalPoints: user.totalPoints || 0,
        currentLevel: user.currentLevel || 1,
        joinDate: format(user.createdAt || new Date(), 'yyyy-MM-dd HH:mm:ss')
      },
      chatHistory: chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: format(new Date(msg.createdAt), 'yyyy-MM-dd HH:mm:ss')
      })),
      generatedImages: generatedImages.map(img => ({
        prompt: img.prompt,
        imageUrl: img.imageUrl,
        createdAt: format(new Date(img.createdAt), 'yyyy-MM-dd HH:mm:ss')
      })),
      videoScripts: videoScripts.map(script => ({
        topic: script.topic,
        platform: script.platform,
        script: script.script,
        createdAt: format(new Date(script.createdAt), 'yyyy-MM-dd HH:mm:ss')
      })),
      achievements: achievements.map(achievement => ({
        title: achievement.title,
        description: achievement.description,
        pointsAwarded: achievement.pointsAwarded,
        unlockedAt: format(new Date(achievement.unlockedAt), 'yyyy-MM-dd HH:mm:ss')
      })),
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export user data');
  }
}

export function formatAsJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function formatAsCSV(data: ExportData): string {
  const sections = [];
  
  // User info
  sections.push('USER INFORMATION');
  sections.push(`Username,Email,Total Points,Level,Join Date`);
  sections.push(`${data.user.username},${data.user.email},${data.user.totalPoints},${data.user.currentLevel},${data.user.joinDate}`);
  sections.push('');
  
  // Chat history
  sections.push('CHAT HISTORY');
  sections.push('Role,Content,Timestamp');
  data.chatHistory.forEach(msg => {
    const content = msg.content.replace(/"/g, '""'); // Escape quotes
    sections.push(`${msg.role},"${content}",${msg.timestamp}`);
  });
  sections.push('');
  
  // Generated images
  sections.push('GENERATED IMAGES');
  sections.push('Prompt,Image URL,Created At');
  data.generatedImages.forEach(img => {
    const prompt = img.prompt.replace(/"/g, '""');
    sections.push(`"${prompt}",${img.imageUrl},${img.createdAt}`);
  });
  sections.push('');
  
  // Video scripts
  sections.push('VIDEO SCRIPTS');
  sections.push('Topic,Platform,Script,Created At');
  data.videoScripts.forEach(script => {
    const topic = script.topic.replace(/"/g, '""');
    const scriptContent = script.script.replace(/"/g, '""');
    sections.push(`"${topic}",${script.platform},"${scriptContent}",${script.createdAt}`);
  });
  sections.push('');
  
  // Achievements
  sections.push('ACHIEVEMENTS');
  sections.push('Title,Description,Points Awarded,Unlocked At');
  data.achievements.forEach(achievement => {
    const title = achievement.title.replace(/"/g, '""');
    const description = achievement.description.replace(/"/g, '""');
    sections.push(`"${title}","${description}",${achievement.pointsAwarded},${achievement.unlockedAt}`);
  });
  
  return sections.join('\n');
}

export function formatAsTXT(data: ExportData): string {
  const sections = [];
  
  sections.push('BONITA AI - USER DATA EXPORT');
  sections.push('================================');
  sections.push(`Export Date: ${data.exportDate}`);
  sections.push('');
  
  // User info
  sections.push('USER INFORMATION');
  sections.push('----------------');
  sections.push(`Username: ${data.user.username}`);
  sections.push(`Email: ${data.user.email}`);
  sections.push(`Total Points: ${data.user.totalPoints}`);
  sections.push(`Current Level: ${data.user.currentLevel}`);
  sections.push(`Join Date: ${data.user.joinDate}`);
  sections.push('');
  
  // Chat history
  sections.push('CHAT HISTORY');
  sections.push('------------');
  data.chatHistory.forEach(msg => {
    sections.push(`[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`);
    sections.push('');
  });
  
  // Generated images
  sections.push('GENERATED IMAGES');
  sections.push('---------------');
  data.generatedImages.forEach((img, index) => {
    sections.push(`${index + 1}. ${img.prompt}`);
    sections.push(`   URL: ${img.imageUrl}`);
    sections.push(`   Created: ${img.createdAt}`);
    sections.push('');
  });
  
  // Video scripts
  sections.push('VIDEO SCRIPTS');
  sections.push('-------------');
  data.videoScripts.forEach((script, index) => {
    sections.push(`${index + 1}. ${script.topic} (${script.platform})`);
    sections.push(`   Created: ${script.createdAt}`);
    sections.push(`   Script: ${script.script}`);
    sections.push('');
  });
  
  // Achievements
  sections.push('ACHIEVEMENTS');
  sections.push('------------');
  data.achievements.forEach((achievement, index) => {
    sections.push(`${index + 1}. ${achievement.title} (+${achievement.pointsAwarded} points)`);
    sections.push(`   ${achievement.description}`);
    sections.push(`   Unlocked: ${achievement.unlockedAt}`);
    sections.push('');
  });
  
  return sections.join('\n');
}