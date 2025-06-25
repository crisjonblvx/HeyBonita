// Rate limiting service
import { db } from './db.js';
import { rateLimits } from '../shared/schema.js';
import { eq, and, gte } from 'drizzle-orm';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Rate limit configurations per endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 messages per minute
  '/api/images': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 images per minute
  '/api/scripts': { windowMs: 60 * 1000, maxRequests: 3 }, // 3 scripts per minute
  '/api/speech': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 speech requests per minute
  '/api/auth/register': { windowMs: 60 * 1000, maxRequests: 3 }, // 3 registration attempts per minute
  '/api/auth/login': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 login attempts per minute
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds until next request allowed
}

export async function checkRateLimit(userId: number, endpoint: string): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint];
  if (!config) {
    // No rate limit configured for this endpoint
    return {
      allowed: true,
      remaining: Infinity,
      resetTime: new Date(Date.now() + 60000)
    };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Get existing rate limit record for this user and endpoint
    const existing = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.userId, userId),
          eq(rateLimits.endpoint, endpoint),
          gte(rateLimits.windowStart, windowStart)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      // First request in this window - create new record
      await db.insert(rateLimits).values({
        userId,
        endpoint,
        requestCount: 1,
        windowStart: now,
        lastRequest: now
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs)
      };
    }

    const record = existing[0];
    const resetTime = new Date(record.windowStart.getTime() + config.windowMs);

    if (record.requestCount >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.max(1, retryAfter)
      };
    }

    // Increment request count
    await db
      .update(rateLimits)
      .set({
        requestCount: record.requestCount + 1,
        lastRequest: now
      })
      .where(eq(rateLimits.id, record.id));

    return {
      allowed: true,
      remaining: config.maxRequests - record.requestCount - 1,
      resetTime
    };

  } catch (error) {
    console.error('Rate limiting error:', error);
    // In case of database error, allow the request
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: new Date(now.getTime() + config.windowMs)
    };
  }
}

export async function cleanupOldRateLimits(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    await db
      .delete(rateLimits)
      .where(
        rateLimits.windowStart < cutoff
      );
  } catch (error) {
    console.error('Failed to cleanup old rate limits:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupOldRateLimits, 60 * 60 * 1000);

export function rateLimitMiddleware(endpoint: string) {
  return async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const result = await checkRateLimit(userId, endpoint);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMITS[endpoint]?.maxRequests?.toString() || 'unlimited',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toISOString(),
    });

    if (!result.allowed) {
      res.set('Retry-After', result.retryAfter?.toString() || '60');
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter
      });
    }

    next();
  };
}