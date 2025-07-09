import { 
  users, 
  chatMessages, 
  generatedImages, 
  videoScripts,
  waitlistEmails,
  achievements,
  userFeedback,
  receipts,
  receiptFolders,
  conversationProjects,
  droppedIdeas,
  commitments,
  type User, 
  type InsertUser,
  type ChatMessage,
  type InsertChatMessage,
  type GeneratedImage,
  type InsertGeneratedImage,
  type VideoScript,
  type InsertVideoScript,
  type WaitlistEmail,
  type InsertWaitlistEmail,
  type Achievement,
  type InsertAchievement,
  type UserFeedback,
  type InsertUserFeedback,
  type Receipt,
  type InsertReceipt,
  type ReceiptFolder,
  type InsertReceiptFolder,
  type ConversationProject,
  type InsertConversationProject,
  type DroppedIdea,
  type InsertDroppedIdea,
  type Commitment,
  type InsertCommitment
} from "@shared/schema";
import { getDb } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
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
  
  // Achievement operations
  getUserAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateUserStats(userId: number, stats: Partial<User>): Promise<User>;
  
  // Feedback operations
  createFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getFeedback(limit?: number): Promise<UserFeedback[]>;
  updateFeedbackStatus(id: number, resolved: boolean): Promise<UserFeedback>;
  
  // Receipts system operations
  getReceipts(userId: number, receiptType?: string, projectName?: string, folderId?: number, limit?: number): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<Receipt>;
  deleteReceipt(id: number): Promise<void>;
  
  // Receipt folder operations
  getReceiptFolders(userId: number): Promise<ReceiptFolder[]>;
  createReceiptFolder(folder: InsertReceiptFolder): Promise<ReceiptFolder>;
  updateReceiptFolder(id: number, updates: Partial<InsertReceiptFolder>): Promise<ReceiptFolder>;
  deleteReceiptFolder(id: number): Promise<void>;
  moveReceiptToFolder(receiptId: number, folderId: number | null): Promise<Receipt>;
  
  // Conversation Projects
  getConversationProjects(userId: number): Promise<ConversationProject[]>;
  createConversationProject(project: InsertConversationProject): Promise<ConversationProject>;
  updateConversationProject(id: number, updates: Partial<InsertConversationProject>): Promise<ConversationProject>;
  
  // Dropped Ideas
  getDroppedIdeas(userId: number, projectId?: number, limit?: number): Promise<DroppedIdea[]>;
  createDroppedIdea(idea: InsertDroppedIdea): Promise<DroppedIdea>;
  markIdeaRediscovered(id: number): Promise<DroppedIdea>;
  
  // Commitments & Accountability
  getCommitments(userId: number, status?: string, limit?: number): Promise<Commitment[]>;
  createCommitment(commitment: InsertCommitment): Promise<Commitment>;
  updateCommitment(id: number, updates: Partial<InsertCommitment>): Promise<Commitment>;
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
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
    try {
      console.log('DatabaseStorage.getChatMessages called with userId:', userId, 'limit:', limit);
      const result = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);
      console.log('DatabaseStorage.getChatMessages result:', result.length, 'messages');
      return result;
    } catch (error) {
      console.error('DatabaseStorage.getChatMessages error:', error);
      throw error;
    }
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

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async updateUserStats(userId: number, stats: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(stats)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async createFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> {
    const [newFeedback] = await db
      .insert(userFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  async getFeedback(limit: number = 50): Promise<UserFeedback[]> {
    return await db
      .select()
      .from(userFeedback)
      .orderBy(desc(userFeedback.createdAt))
      .limit(limit);
  }

  async updateFeedbackStatus(id: number, resolved: boolean): Promise<UserFeedback> {
    const [feedback] = await db
      .update(userFeedback)
      .set({ resolved })
      .where(eq(userFeedback.id, id))
      .returning();
    return feedback;
  }

  // Receipts system operations
  async getReceipts(userId: number, receiptType?: string, projectName?: string, folderId?: number, limit: number = 50): Promise<Receipt[]> {
    const conditions = [eq(receipts.userId, userId)];
    
    if (folderId !== undefined) {
      conditions.push(eq(receipts.folderId, folderId));
    }
    
    return await db
      .select()
      .from(receipts)
      .where(and(...conditions))
      .orderBy(desc(receipts.createdAt))
      .limit(limit);
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db
      .insert(receipts)
      .values(receipt)
      .returning();
    return newReceipt;
  }

  async updateReceipt(id: number, updates: Partial<InsertReceipt>): Promise<Receipt> {
    const [updatedReceipt] = await db
      .update(receipts)
      .set(updates)
      .where(eq(receipts.id, id))
      .returning();
    return updatedReceipt;
  }

  async deleteReceipt(id: number): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  // Receipt folder operations
  async getReceiptFolders(userId: number): Promise<ReceiptFolder[]> {
    return await db
      .select()
      .from(receiptFolders)
      .where(eq(receiptFolders.userId, userId))
      .orderBy(desc(receiptFolders.createdAt));
  }

  async createReceiptFolder(folder: InsertReceiptFolder): Promise<ReceiptFolder> {
    const [newFolder] = await db
      .insert(receiptFolders)
      .values(folder)
      .returning();
    return newFolder;
  }

  async updateReceiptFolder(id: number, updates: Partial<InsertReceiptFolder>): Promise<ReceiptFolder> {
    const [updatedFolder] = await db
      .update(receiptFolders)
      .set(updates)
      .where(eq(receiptFolders.id, id))
      .returning();
    return updatedFolder;
  }

  async deleteReceiptFolder(id: number): Promise<void> {
    // First move all receipts out of this folder
    await db
      .update(receipts)
      .set({ folderId: null })
      .where(eq(receipts.folderId, id));
    
    // Then delete the folder
    await db.delete(receiptFolders).where(eq(receiptFolders.id, id));
  }

  async moveReceiptToFolder(receiptId: number, folderId: number | null): Promise<Receipt> {
    const [updatedReceipt] = await db
      .update(receipts)
      .set({ folderId })
      .where(eq(receipts.id, receiptId))
      .returning();
    return updatedReceipt;
  }

  // Conversation Projects
  async getConversationProjects(userId: number): Promise<ConversationProject[]> {
    return await db
      .select()
      .from(conversationProjects)
      .where(eq(conversationProjects.userId, userId))
      .orderBy(desc(conversationProjects.lastActivityAt));
  }

  async createConversationProject(project: InsertConversationProject): Promise<ConversationProject> {
    const [newProject] = await db
      .insert(conversationProjects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateConversationProject(id: number, updates: Partial<InsertConversationProject>): Promise<ConversationProject> {
    const [updatedProject] = await db
      .update(conversationProjects)
      .set({ ...updates, lastActivityAt: new Date() })
      .where(eq(conversationProjects.id, id))
      .returning();
    return updatedProject;
  }

  // Dropped Ideas
  async getDroppedIdeas(userId: number, projectId?: number, limit: number = 50): Promise<DroppedIdea[]> {
    let query = db.select().from(droppedIdeas).where(eq(droppedIdeas.userId, userId));
    
    if (projectId) {
      query = query.where(eq(droppedIdeas.projectId, projectId));
    }
    
    return await query.orderBy(desc(droppedIdeas.createdAt)).limit(limit);
  }

  async createDroppedIdea(idea: InsertDroppedIdea): Promise<DroppedIdea> {
    const [newIdea] = await db
      .insert(droppedIdeas)
      .values(idea)
      .returning();
    return newIdea;
  }

  async markIdeaRediscovered(id: number): Promise<DroppedIdea> {
    const [updatedIdea] = await db
      .update(droppedIdeas)
      .set({ 
        isRediscovered: true, 
        rediscoveredAt: new Date() 
      })
      .where(eq(droppedIdeas.id, id))
      .returning();
    return updatedIdea;
  }

  // Commitments & Accountability
  async getCommitments(userId: number, status?: string, limit: number = 50): Promise<Commitment[]> {
    let query = db.select().from(commitments).where(eq(commitments.userId, userId));
    
    if (status) {
      query = query.where(eq(commitments.status, status));
    }
    
    return await query.orderBy(desc(commitments.createdAt)).limit(limit);
  }

  async createCommitment(commitment: InsertCommitment): Promise<Commitment> {
    const [newCommitment] = await db
      .insert(commitments)
      .values(commitment)
      .returning();
    return newCommitment;
  }

  async updateCommitment(id: number, updates: Partial<InsertCommitment>): Promise<Commitment> {
    const [updatedCommitment] = await db
      .update(commitments)
      .set(updates)
      .where(eq(commitments.id, id))
      .returning();
    return updatedCommitment;
  }
}

export const storage = new DatabaseStorage();
