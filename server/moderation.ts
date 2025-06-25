// Content moderation service
import OpenAI from 'openai';
import { db } from './db.js';
import { moderationFlags } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface ModerationResult {
  isAllowed: boolean;
  flagReason?: string;
  severity: 'low' | 'medium' | 'high';
  filteredContent?: string;
}

// Basic keyword filtering for immediate blocking
const BLOCKED_KEYWORDS = [
  // Violence and harmful content
  'kill yourself', 'harm yourself', 'end your life', 'commit suicide',
  // Illegal activities
  'how to make drugs', 'how to make bombs', 'make explosives',
  // Hate speech (basic filtering)
  'racial slur examples would go here'
];

const SUSPICIOUS_PATTERNS = [
  /\b(how to (?:kill|murder|harm))\b/i,
  /\b(suicide (?:methods|ways))\b/i,
  /\b(make (?:drugs|bombs|weapons))\b/i,
  /\b(hack (?:into|someone))\b/i,
];

export async function moderateContent(
  content: string, 
  contentType: 'chat' | 'image_prompt' | 'script',
  userId: number
): Promise<ModerationResult> {
  try {
    // First pass: Basic keyword and pattern filtering
    const basicCheck = await basicModeration(content);
    if (!basicCheck.isAllowed) {
      await logModerationFlag(userId, contentType, content, basicCheck.flagReason!, basicCheck.severity);
      return basicCheck;
    }

    // Second pass: OpenAI moderation for nuanced content
    const openaiCheck = await openaiModeration(content);
    if (!openaiCheck.isAllowed) {
      await logModerationFlag(userId, contentType, content, openaiCheck.flagReason!, openaiCheck.severity);
      return openaiCheck;
    }

    return { isAllowed: true, severity: 'low' };
  } catch (error) {
    console.error('Moderation error:', error);
    // In case of moderation service failure, be permissive but log
    return { isAllowed: true, severity: 'low' };
  }
}

async function basicModeration(content: string): Promise<ModerationResult> {
  const lowerContent = content.toLowerCase();
  
  // Check for blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return {
        isAllowed: false,
        flagReason: 'Contains prohibited content',
        severity: 'high'
      };
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isAllowed: false,
        flagReason: 'Contains suspicious content pattern',
        severity: 'medium'
      };
    }
  }

  return { isAllowed: true, severity: 'low' };
}

async function openaiModeration(content: string): Promise<ModerationResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    
    if (result.flagged) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      let flagReason = 'Content policy violation';

      // Determine severity based on categories
      if (result.categories.violence || result.categories.self_harm || result.categories.hate) {
        severity = 'high';
        flagReason = 'High-risk content detected';
      } else if (result.categories.sexual || result.categories.harassment) {
        severity = 'medium';
        flagReason = 'Inappropriate content detected';
      }

      return {
        isAllowed: false,
        flagReason,
        severity
      };
    }

    return { isAllowed: true, severity: 'low' };
  } catch (error) {
    console.error('OpenAI moderation error:', error);
    // Fallback to allow if OpenAI moderation fails
    return { isAllowed: true, severity: 'low' };
  }
}

async function logModerationFlag(
  userId: number,
  contentType: 'chat' | 'image_prompt' | 'script',
  content: string,
  flagReason: string,
  severity: 'low' | 'medium' | 'high'
): Promise<void> {
  try {
    await db.insert(moderationFlags).values({
      userId,
      contentType,
      originalContent: content,
      flagReason,
      severity,
      isBlocked: severity === 'high'
    });
  } catch (error) {
    console.error('Failed to log moderation flag:', error);
  }
}

export async function getModerationFlags(userId?: number, limit: number = 50) {
  try {
    const query = db.select().from(moderationFlags).limit(limit).orderBy(moderationFlags.flaggedAt);
    
    if (userId) {
      return await query.where(eq(moderationFlags.userId, userId));
    }
    
    return await query;
  } catch (error) {
    console.error('Failed to get moderation flags:', error);
    return [];
  }
}