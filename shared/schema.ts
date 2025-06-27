import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash"), // For authentication
  // OAuth fields
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  provider: text("provider").default("local"), // 'local', 'google', 'apple'
  language: text("language").default("en"),
  theme: text("theme").default("light"),
  colorScheme: text("color_scheme").default("red"),
  toneMode: text("tone_mode").default("sweet-nurturing"),
  voiceEnabled: boolean("voice_enabled").default(true),
  // Gamification fields
  points: integer("points").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActiveDate: timestamp("last_active_date"),
  totalChats: integer("total_chats").default(0),
  totalImages: integer("total_images").default(0),
  totalScripts: integer("total_scripts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  language: text("language").default("en"),
  toneMode: text("tone_mode").default("sweet-nurturing"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedImages = pgTable("generated_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoScripts = pgTable("video_scripts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  topic: text("topic").notNull(),
  platform: text("platform").notNull(),
  script: text("script").notNull(),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const waitlistEmails = pgTable("waitlist_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'first_chat', 'chat_streak_7', 'image_creator', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

// Rate limiting table
export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  requestCount: integer("request_count").notNull().default(1),
  windowStart: timestamp("window_start").defaultNow().notNull(),
  lastRequest: timestamp("last_request").defaultNow().notNull(),
});

// Content moderation flags
export const moderationFlags = pgTable("moderation_flags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  contentId: integer("content_id"),
  originalContent: text("original_content").notNull(),
  flagReason: varchar("flag_reason", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default('low'),
  isBlocked: boolean("is_blocked").notNull().default(false),
  reviewedAt: timestamp("reviewed_at"),
  flaggedAt: timestamp("flagged_at").defaultNow().notNull(),
});

export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  feedbackType: text("feedback_type").notNull(), // 'like', 'dislike', 'bug', 'suggestion', 'general'
  feedbackText: text("feedback_text"),
  rating: integer("rating"), // 1-5 stars
  page: text("page"), // which page/feature the feedback is about
  userAgent: text("user_agent"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipts folder system - tracks everything Bonita does for accountability
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  receiptType: text("receipt_type").notNull(), // 'conversation', 'idea', 'script', 'task', 'decision', 'voice_note', 'commitment'
  projectName: text("project_name"), // auto-detected or user-assigned project
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(), // for categorization and search
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").default("active"), // 'active', 'completed', 'dropped', 'archived'
  relatedReceiptId: integer("related_receipt_id"), // for linking related items
  voiceNoteUrl: text("voice_note_url"), // for voice recordings
  metadata: jsonb("metadata"), // flexible data for additional context
  reminderDate: timestamp("reminder_date"), // when to remind user about this
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations organized by project
export const conversationProjects = pgTable("conversation_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectName: text("project_name").notNull(),
  description: text("description"),
  color: text("color").default("blue"), // visual organization
  isActive: boolean("is_active").default(true),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ideas that were mentioned but potentially forgotten
export const droppedIdeas = pgTable("dropped_ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ideaText: text("idea_text").notNull(),
  context: text("context"), // what conversation/project it came from
  projectId: integer("project_id").references(() => conversationProjects.id),
  isRediscovered: boolean("is_rediscovered").default(false), // if user came back to it
  reminderSent: boolean("reminder_sent").default(false),
  priority: text("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  rediscoveredAt: timestamp("rediscovered_at"),
});

// Accountability tracking - what user said they wanted to do
export const commitments = pgTable("commitments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  commitmentText: text("commitment_text").notNull(),
  dueDate: timestamp("due_date"),
  projectId: integer("project_id").references(() => conversationProjects.id),
  status: text("status").default("pending"), // 'pending', 'completed', 'overdue', 'cancelled'
  remindersSent: integer("reminders_sent").default(0),
  lastReminderAt: timestamp("last_reminder_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  chatMessages: many(chatMessages),
  generatedImages: many(generatedImages),
  videoScripts: many(videoScripts),
  achievements: many(achievements),
  receipts: many(receipts),
  conversationProjects: many(conversationProjects),
  droppedIdeas: many(droppedIdeas),
  commitments: many(commitments),
}));

export const receiptRelations = relations(receipts, ({ one }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
  relatedReceipt: one(receipts, {
    fields: [receipts.relatedReceiptId],
    references: [receipts.id],
  }),
}));

export const conversationProjectRelations = relations(conversationProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [conversationProjects.userId],
    references: [users.id],
  }),
  droppedIdeas: many(droppedIdeas),
  commitments: many(commitments),
}));

export const droppedIdeaRelations = relations(droppedIdeas, ({ one }) => ({
  user: one(users, {
    fields: [droppedIdeas.userId],
    references: [users.id],
  }),
  project: one(conversationProjects, {
    fields: [droppedIdeas.projectId],
    references: [conversationProjects.id],
  }),
}));

export const commitmentRelations = relations(commitments, ({ one }) => ({
  user: one(users, {
    fields: [commitments.userId],
    references: [users.id],
  }),
  project: one(conversationProjects, {
    fields: [commitments.projectId],
    references: [conversationProjects.id],
  }),
}));

export const achievementRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const generatedImageRelations = relations(generatedImages, ({ one }) => ({
  user: one(users, {
    fields: [generatedImages.userId],
    references: [users.id],
  }),
}));

export const videoScriptRelations = relations(videoScripts, ({ one }) => ({
  user: one(users, {
    fields: [videoScripts.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({
  id: true,
  createdAt: true,
});

export const insertVideoScriptSchema = createInsertSchema(videoScripts).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistEmailSchema = createInsertSchema(waitlistEmails).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  windowStart: true,
  lastRequest: true,
});

export const insertModerationFlagSchema = createInsertSchema(moderationFlags).omit({
  id: true,
  flaggedAt: true,
  reviewedAt: true,
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertConversationProjectSchema = createInsertSchema(conversationProjects).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});

export const insertDroppedIdeaSchema = createInsertSchema(droppedIdeas).omit({
  id: true,
  createdAt: true,
  rediscoveredAt: true,
});

export const insertCommitmentSchema = createInsertSchema(commitments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  lastReminderAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertVideoScript = z.infer<typeof insertVideoScriptSchema>;
export type VideoScript = typeof videoScripts.$inferSelect;
export type InsertWaitlistEmail = z.infer<typeof insertWaitlistEmailSchema>;
export type WaitlistEmail = typeof waitlistEmails.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertModerationFlag = z.infer<typeof insertModerationFlagSchema>;
export type ModerationFlag = typeof moderationFlags.$inferSelect;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;

// Receipts system types
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertConversationProject = z.infer<typeof insertConversationProjectSchema>;
export type ConversationProject = typeof conversationProjects.$inferSelect;
export type InsertDroppedIdea = z.infer<typeof insertDroppedIdeaSchema>;
export type DroppedIdea = typeof droppedIdeas.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitments.$inferSelect;

// Export analytics tables
export * from './analytics';
