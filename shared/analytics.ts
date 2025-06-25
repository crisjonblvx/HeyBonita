import { pgTable, integer, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Analytics events table
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id'),
  sessionId: text('session_id').notNull(),
  eventType: text('event_type').notNull(), // 'page_view', 'chat_sent', 'image_generated', 'script_created', 'login', 'signup'
  eventData: text('event_data'), // JSON string for additional data
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Support tickets table
export const supportTickets = pgTable('support_tickets', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: integer('user_id'),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('open').notNull(), // 'open', 'in_progress', 'resolved', 'closed'
  priority: text('priority').default('medium').notNull(), // 'low', 'medium', 'high', 'urgent'
  tags: text('tags').array().default([]),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User sessions for tracking activity
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id'),
  sessionStart: timestamp('session_start').defaultNow().notNull(),
  sessionEnd: timestamp('session_end'),
  duration: integer('duration'), // in seconds
  pageViews: integer('page_views').default(0),
  actionsCount: integer('actions_count').default(0),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

// Import users table reference  
import { users } from './schema';

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  sessionStart: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;