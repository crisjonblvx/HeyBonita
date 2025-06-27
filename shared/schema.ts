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

export const userRelations = relations(users, ({ many }) => ({
  chatMessages: many(chatMessages),
  generatedImages: many(generatedImages),
  videoScripts: many(videoScripts),
  achievements: many(achievements),
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

// Export analytics tables
export * from './analytics';
