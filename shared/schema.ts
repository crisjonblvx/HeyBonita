import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  language: text("language").default("en"),
  theme: text("theme").default("light"),
  colorScheme: text("color_scheme").default("red"),
  toneMode: text("tone_mode").default("sweet-nurturing"),
  voiceEnabled: boolean("voice_enabled").default(true),
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

export const userRelations = relations(users, ({ many }) => ({
  chatMessages: many(chatMessages),
  generatedImages: many(generatedImages),
  videoScripts: many(videoScripts),
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
