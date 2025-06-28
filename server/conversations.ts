import { db } from './db';
import { conversations, chatMessages, users } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { InsertConversation, Conversation, ChatMessage } from '@shared/schema';

// Create a new conversation thread
export async function createConversation(userId: number, title: string, description?: string): Promise<Conversation> {
  const [conversation] = await db
    .insert(conversations)
    .values({
      userId,
      title,
      description,
      messageCount: 0,
      lastMessageAt: new Date()
    })
    .returning();
  
  return conversation;
}

// Get all conversations for a user
export async function getUserConversations(userId: number): Promise<Conversation[]> {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.lastMessageAt));
}

// Get a specific conversation with its messages
export async function getConversationWithMessages(conversationId: number, userId: number): Promise<{
  conversation: Conversation | null;
  messages: ChatMessage[];
}> {
  // Get conversation
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ));

  if (!conversation) {
    return { conversation: null, messages: [] };
  }

  // Get messages for this conversation
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);

  return { conversation, messages };
}

// Add a message to a conversation
export async function addMessageToConversation(
  conversationId: number,
  userId: number,
  role: 'user' | 'assistant',
  content: string,
  language: string = 'en',
  toneMode: string = 'sweet-nurturing'
): Promise<ChatMessage> {
  // Add the message
  const [message] = await db
    .insert(chatMessages)
    .values({
      userId,
      conversationId,
      role,
      content,
      language,
      toneMode
    })
    .returning();

  // Update conversation metadata
  await db
    .update(conversations)
    .set({
      messageCount: db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)),
      lastMessageAt: new Date()
    })
    .where(eq(conversations.id, conversationId));

  return message;
}

// Archive a conversation
export async function archiveConversation(conversationId: number, userId: number): Promise<boolean> {
  const result = await db
    .update(conversations)
    .set({ isArchived: true })
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ));

  return result.rowCount > 0;
}

// Update conversation title and description
export async function updateConversation(
  conversationId: number,
  userId: number,
  updates: { title?: string; description?: string }
): Promise<boolean> {
  const result = await db
    .update(conversations)
    .set(updates)
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ));

  return result.rowCount > 0;
}

// Delete a conversation and all its messages
export async function deleteConversation(conversationId: number, userId: number): Promise<boolean> {
  // First delete all messages
  await db
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  // Then delete the conversation
  const result = await db
    .delete(conversations)
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ));

  return result.rowCount > 0;
}

// Search conversations by title or content
export async function searchConversations(userId: number, query: string): Promise<Conversation[]> {
  return await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.userId, userId),
      // Simple text search - in production, you'd use full-text search
      // This is a basic implementation for demonstration
    ))
    .orderBy(desc(conversations.lastMessageAt));
}

// Get conversation analytics
export async function getConversationStats(userId: number): Promise<{
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  mostActiveDay: string;
}> {
  const stats = await db
    .select({
      totalConversations: conversations.id,
      totalMessages: chatMessages.id
    })
    .from(conversations)
    .leftJoin(chatMessages, eq(conversations.id, chatMessages.conversationId))
    .where(eq(conversations.userId, userId));

  // Process stats (simplified calculation)
  const totalConversations = new Set(stats.map(s => s.totalConversations)).size;
  const totalMessages = stats.filter(s => s.totalMessages).length;
  const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation: Math.round(averageMessagesPerConversation * 100) / 100,
    mostActiveDay: 'Monday' // Placeholder - would calculate from actual data
  };
}