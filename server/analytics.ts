import { db } from './db';
import { analyticsEvents, userSessions, supportTickets, InsertAnalyticsEvent, InsertSupportTicket } from '@shared/analytics';
import { eq, desc, count, sql, and, gte } from 'drizzle-orm';

// Track analytics events
export async function trackEvent(event: InsertAnalyticsEvent) {
  try {
    await db.insert(analyticsEvents).values(event);
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}

// Get basic metrics for dashboard
export async function getAnalyticsMetrics(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    // Total users - get from users table instead of analytics events
    const { users } = await import('@shared/schema');
    const totalUsers = await db.select({ count: count() }).from(users);

    // Daily active users
    const dailyActiveUsers = await db.select({ 
      date: sql<string>`DATE(${analyticsEvents.createdAt})`,
      users: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`
    })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
      .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

    // Event counts by type
    const eventCounts = await db.select({
      eventType: analyticsEvents.eventType,
      count: count()
    })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(analyticsEvents.eventType);

    // Most active users
    const topUsers = await db.select({
      userId: analyticsEvents.userId,
      eventCount: count()
    })
      .from(analyticsEvents)
      .where(and(
        gte(analyticsEvents.createdAt, since),
        sql`${analyticsEvents.userId} IS NOT NULL`
      ))
      .groupBy(analyticsEvents.userId)
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      dailyActiveUsers,
      eventCounts,
      topUsers,
      period: `${days} days`
    };
  } catch (error) {
    console.error('Failed to get analytics metrics:', error);
    return null;
  }
}

// Create support ticket
export async function createSupportTicket(ticket: InsertSupportTicket) {
  try {
    const [newTicket] = await db.insert(supportTickets).values(ticket).returning();
    
    // Send email notification (you'll implement this with your preferred service)
    console.log(`New support ticket #${newTicket.id}: ${ticket.subject}`);
    
    return newTicket;
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    throw error;
  }
}

// Get support tickets for admin
export async function getSupportTickets(status?: string) {
  try {
    const tickets = await db.select()
      .from(supportTickets)
      .where(status ? eq(supportTickets.status, status) : undefined)
      .orderBy(desc(supportTickets.createdAt));
    
    return tickets;
  } catch (error) {
    console.error('Failed to get support tickets:', error);
    return [];
  }
}

// Update support ticket status
export async function updateSupportTicket(id: number, updates: Partial<InsertSupportTicket>) {
  try {
    const [updatedTicket] = await db.update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    
    return updatedTicket;
  } catch (error) {
    console.error('Failed to update support ticket:', error);
    throw error;
  }
}