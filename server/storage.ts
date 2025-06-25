import { 
  users, 
  chatMessages, 
  generatedImages, 
  videoScripts,
  waitlistEmails,
  type User, 
  type InsertUser,
  type ChatMessage,
  type InsertChatMessage,
  type GeneratedImage,
  type InsertGeneratedImage,
  type VideoScript,
  type InsertVideoScript,
  type WaitlistEmail,
  type InsertWaitlistEmail
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Chat message operations
  getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(userId: number): Promise<void>;
  
  // Generated image operations
  getGeneratedImages(userId: number, limit?: number): Promise<GeneratedImage[]>;
  createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage>;
  
  // Video script operations
  getVideoScripts(userId: number, limit?: number): Promise<VideoScript[]>;
  createVideoScript(script: InsertVideoScript): Promise<VideoScript>;
  
  // Waitlist operations
  addToWaitlist(email: InsertWaitlistEmail): Promise<WaitlistEmail>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  async clearChatMessages(userId: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async getGeneratedImages(userId: number, limit: number = 20): Promise<GeneratedImage[]> {
    return await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId))
      .orderBy(desc(generatedImages.createdAt))
      .limit(limit);
  }

  async createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage> {
    const [generatedImage] = await db
      .insert(generatedImages)
      .values(image)
      .returning();
    return generatedImage;
  }

  async getVideoScripts(userId: number, limit: number = 20): Promise<VideoScript[]> {
    return await db
      .select()
      .from(videoScripts)
      .where(eq(videoScripts.userId, userId))
      .orderBy(desc(videoScripts.createdAt))
      .limit(limit);
  }

  async createVideoScript(script: InsertVideoScript): Promise<VideoScript> {
    const [videoScript] = await db
      .insert(videoScripts)
      .values(script)
      .returning();
    return videoScript;
  }

  async addToWaitlist(email: InsertWaitlistEmail): Promise<WaitlistEmail> {
    const [newEmail] = await db.insert(waitlistEmails).values(email).returning();
    return newEmail;
  }
}

export const storage = new DatabaseStorage();
