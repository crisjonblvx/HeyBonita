import { storage } from './storage';
import type { User, Achievement } from '@shared/schema';

export interface GameificationReward {
  pointsEarned: number;
  newAchievements: Achievement[];
  levelUp?: boolean;
  newLevel?: number;
}

// Achievement definitions with Bonita's personality
export const ACHIEVEMENT_TYPES = {
  FIRST_CHAT: {
    type: 'first_chat',
    title: 'Welcome to the Family!',
    description: 'Had your first chat with Bonita',
    points: 10,
  },
  CHAT_STREAK_3: {
    type: 'chat_streak_3',
    title: 'Getting the Hang of It',
    description: '3-day chat streak - you\'re building that connection!',
    points: 25,
  },
  CHAT_STREAK_7: {
    type: 'chat_streak_7',
    title: 'Bonita\'s Favorite',
    description: '7-day chat streak - now we\'re talking!',
    points: 50,
  },
  CHAT_STREAK_30: {
    type: 'chat_streak_30',
    title: 'Family for Life',
    description: '30-day streak - you\'re part of the family now!',
    points: 100,
  },
  FIRST_IMAGE: {
    type: 'first_image',
    title: 'Creative Vision',
    description: 'Generated your first image with Bonita',
    points: 15,
  },
  IMAGE_CREATOR: {
    type: 'image_creator',
    title: 'Visual Storyteller',
    description: 'Generated 10 images - you got that artistic eye!',
    points: 75,
  },
  FIRST_SCRIPT: {
    type: 'first_script',
    title: 'Content Creator',
    description: 'Created your first video script',
    points: 20,
  },
  SCRIPT_MASTER: {
    type: 'script_master',
    title: 'Script Master',
    description: 'Created 5 video scripts - you\'re ready for the big screen!',
    points: 60,
  },
  CHATTER: {
    type: 'chatter',
    title: 'Conversation Champion',
    description: 'Had 50 chats with Bonita - we love to talk!',
    points: 80,
  },
  EXPLORER: {
    type: 'explorer',
    title: 'Feature Explorer',
    description: 'Used chat, image generation, and video scripts',
    points: 40,
  },
} as const;

// Level thresholds and rewards
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000];

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getPointsForNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 0; // Max level reached
  }
  return LEVEL_THRESHOLDS[currentLevel] - currentPoints;
}

export function calculateStreak(lastActiveDate: Date | null, currentDate: Date = new Date()): number {
  if (!lastActiveDate) return 0;
  
  const daysDiff = Math.floor((currentDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) {
    // Same day or consecutive day maintains streak
    return 1; // Will be incremented by caller if it's a new day
  } else {
    // Streak broken
    return 0;
  }
}

export async function updateUserActivity(userId: number): Promise<GameificationReward> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const currentDate = new Date();
  const isNewDay = !user.lastActiveDate || 
    new Date(user.lastActiveDate).toDateString() !== currentDate.toDateString();

  let newStreak = user.streak || 0;
  if (isNewDay) {
    const streakFromLastActive = calculateStreak(user.lastActiveDate, currentDate);
    newStreak = streakFromLastActive === 0 ? 1 : (user.streak || 0) + 1;
  }

  // Update user stats
  await storage.updateUserStats(userId, {
    lastActiveDate: currentDate,
    streak: newStreak,
  });

  // Check for streak achievements
  const newAchievements: Achievement[] = [];
  const existingAchievements = await storage.getUserAchievements(userId);
  const achievementTypes = existingAchievements.map(a => a.type);

  if (newStreak === 3 && !achievementTypes.includes('chat_streak_3')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.CHAT_STREAK_3,
    });
    newAchievements.push(achievement);
  }

  if (newStreak === 7 && !achievementTypes.includes('chat_streak_7')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.CHAT_STREAK_7,
    });
    newAchievements.push(achievement);
  }

  if (newStreak === 30 && !achievementTypes.includes('chat_streak_30')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.CHAT_STREAK_30,
    });
    newAchievements.push(achievement);
  }

  return {
    pointsEarned: 0,
    newAchievements,
  };
}

export async function rewardChatActivity(userId: number): Promise<GameificationReward> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const newTotalChats = (user.totalChats || 0) + 1;
  const newPoints = (user.points || 0) + 5; // 5 points per chat
  const oldLevel = user.level || 1;
  const newLevel = calculateLevel(newPoints);

  // Update user stats
  await storage.updateUserStats(userId, {
    totalChats: newTotalChats,
    points: newPoints,
    level: newLevel,
  });

  // Check for achievements
  const newAchievements: Achievement[] = [];
  const existingAchievements = await storage.getUserAchievements(userId);
  const achievementTypes = existingAchievements.map(a => a.type);

  if (newTotalChats === 1 && !achievementTypes.includes('first_chat')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.FIRST_CHAT,
    });
    newAchievements.push(achievement);
  }

  if (newTotalChats === 50 && !achievementTypes.includes('chatter')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.CHATTER,
    });
    newAchievements.push(achievement);
  }

  // Update activity streak
  const activityReward = await updateUserActivity(userId);
  newAchievements.push(...activityReward.newAchievements);

  return {
    pointsEarned: 5,
    newAchievements,
    levelUp: newLevel > oldLevel,
    newLevel: newLevel > oldLevel ? newLevel : undefined,
  };
}

export async function rewardImageGeneration(userId: number): Promise<GameificationReward> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const newTotalImages = (user.totalImages || 0) + 1;
  const newPoints = (user.points || 0) + 10; // 10 points per image
  const oldLevel = user.level || 1;
  const newLevel = calculateLevel(newPoints);

  // Update user stats
  await storage.updateUserStats(userId, {
    totalImages: newTotalImages,
    points: newPoints,
    level: newLevel,
  });

  // Check for achievements
  const newAchievements: Achievement[] = [];
  const existingAchievements = await storage.getUserAchievements(userId);
  const achievementTypes = existingAchievements.map(a => a.type);

  if (newTotalImages === 1 && !achievementTypes.includes('first_image')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.FIRST_IMAGE,
    });
    newAchievements.push(achievement);
  }

  if (newTotalImages === 10 && !achievementTypes.includes('image_creator')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.IMAGE_CREATOR,
    });
    newAchievements.push(achievement);
  }

  return {
    pointsEarned: 10,
    newAchievements,
    levelUp: newLevel > oldLevel,
    newLevel: newLevel > oldLevel ? newLevel : undefined,
  };
}

export async function rewardScriptCreation(userId: number): Promise<GameificationReward> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const newTotalScripts = (user.totalScripts || 0) + 1;
  const newPoints = (user.points || 0) + 15; // 15 points per script
  const oldLevel = user.level || 1;
  const newLevel = calculateLevel(newPoints);

  // Update user stats
  await storage.updateUserStats(userId, {
    totalScripts: newTotalScripts,
    points: newPoints,
    level: newLevel,
  });

  // Check for achievements
  const newAchievements: Achievement[] = [];
  const existingAchievements = await storage.getUserAchievements(userId);
  const achievementTypes = existingAchievements.map(a => a.type);

  if (newTotalScripts === 1 && !achievementTypes.includes('first_script')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.FIRST_SCRIPT,
    });
    newAchievements.push(achievement);
  }

  if (newTotalScripts === 5 && !achievementTypes.includes('script_master')) {
    const achievement = await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.SCRIPT_MASTER,
    });
    newAchievements.push(achievement);
  }

  return {
    pointsEarned: 15,
    newAchievements,
    levelUp: newLevel > oldLevel,
    newLevel: newLevel > oldLevel ? newLevel : undefined,
  };
}

export async function checkExplorerAchievement(userId: number): Promise<Achievement | null> {
  const user = await storage.getUser(userId);
  if (!user) return null;

  const existingAchievements = await storage.getUserAchievements(userId);
  const achievementTypes = existingAchievements.map(a => a.type);

  // Check if user has used all three features and doesn't have explorer achievement
  if (
    (user.totalChats || 0) > 0 &&
    (user.totalImages || 0) > 0 &&
    (user.totalScripts || 0) > 0 &&
    !achievementTypes.includes('explorer')
  ) {
    return await storage.createAchievement({
      userId,
      ...ACHIEVEMENT_TYPES.EXPLORER,
    });
  }

  return null;
}