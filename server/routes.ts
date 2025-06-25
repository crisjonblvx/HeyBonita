import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  chatWithBonita, 
  generateImage, 
  generateVideoScript, 
  transcribeAudio,
  type BonitaPersonality 
} from "./openai";
import { generateSpeechWithElevenLabs } from "./elevenlabs";
import { 
  insertChatMessageSchema, 
  insertGeneratedImageSchema, 
  insertVideoScriptSchema,
  insertUserSchema 
} from "@shared/schema";
import { 
  rewardChatActivity, 
  rewardImageGeneration, 
  rewardScriptCreation, 
  checkExplorerAchievement 
} from "./gamification";
import { trackEvent, getAnalyticsMetrics, createSupportTicket, getSupportTickets } from "./analytics";
import { moderateContent } from "./moderation";
import { rateLimitMiddleware } from "./rate-limiting";
import { exportUserData, formatAsJSON, formatAsCSV, formatAsTXT } from "./export";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcrypt";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes with rate limiting
  app.post("/api/auth/register", rateLimitMiddleware('/api/auth/register'), async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        passwordHash,
      });
      
      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, message: "Account created successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", rateLimitMiddleware('/api/auth/login'), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      let user = await storage.getUser(userId);
      if (!user) {
        // Create default user if not exists
        user = await storage.createUser({
          username: `user${userId}`,
          email: `user${userId}@example.com`,
          points: 150,
          level: 2,
          streak: 3,
          totalChats: 25,
          totalImages: 8,
          totalScripts: 12,
        });
      }
      res.json(user);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Alternative endpoint for compatibility
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      let user = await storage.getUser(userId);
      if (!user) {
        // Create default user if not exists
        user = await storage.createUser({
          username: `user${userId}`,
          email: `user${userId}@example.com`,
          points: 150,
          level: 2,
          streak: 3,
          totalChats: 25,
          totalImages: 8,
          totalScripts: 12,
        });
      }
      res.json(user);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Export user data endpoint
  app.get("/api/export/:format", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const format = req.params.format;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!['json', 'csv', 'txt'].includes(format)) {
        return res.status(400).json({ error: "Invalid format. Use json, csv, or txt" });
      }

      const exportData = await exportUserData(userId);
      const user = await storage.getUser(userId);
      const filename = `bonita-export-${user?.username}-${new Date().toISOString().split('T')[0]}`;

      let formattedData: string;
      let contentType: string;

      switch (format) {
        case 'json':
          formattedData = formatAsJSON(exportData);
          contentType = 'application/json';
          break;
        case 'csv':
          formattedData = formatAsCSV(exportData);
          contentType = 'text/csv';
          break;
        case 'txt':
          formattedData = formatAsTXT(exportData);
          contentType = 'text/plain';
          break;
        default:
          return res.status(400).json({ error: "Invalid format" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
      res.setHeader('Content-Type', contentType);
      res.send(formattedData);

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Failed to export user data" });
    }
  });

  // Chat routes
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await storage.getChatMessages(userId);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  app.post("/api/chat", rateLimitMiddleware('/api/chat'), async (req, res) => {
    try {
      const { userId, message, language = 'en', toneMode = 'sweet-nurturing', responseMode = 'detailed' } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "User ID and message are required" });
      }

      // Extract just the message text if it's wrapped in an object
      const messageText = typeof message === 'string' ? message : message.message || JSON.stringify(message);

      // Content moderation check
      const moderationResult = await moderateContent(messageText.trim(), 'chat', userId);
      if (!moderationResult.isAllowed) {
        return res.status(400).json({ 
          error: "Message blocked by content filter",
          reason: moderationResult.flagReason,
          message: "Please rephrase your message and try again."
        });
      }

      // Save user message
      await storage.createChatMessage({
        userId,
        role: 'user',
        content: messageText,
        language,
        toneMode
      });

      // Get chat history for context (excluding the current message)
      const chatHistory = await storage.getChatMessages(userId, 10);
      const historyFormatted = chatHistory
        .filter(msg => msg.content !== messageText) // Exclude the current message from history
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        }));

      // Get Bonita's response
      const personality: BonitaPersonality = {
        language: language as 'en' | 'es' | 'pt' | 'fr',
        toneMode: toneMode as 'sweet-nurturing' | 'tough-love',
        responseMode: responseMode as 'quick' | 'detailed'
      };

      const bonitaResponse = await chatWithBonita(messageText, personality, historyFormatted);

      // Save Bonita's response
      const savedResponse = await storage.createChatMessage({
        userId,
        role: 'assistant',
        content: bonitaResponse,
        language,
        toneMode
      });

      // Award gamification points for chat activity
      try {
        const gamificationReward = await rewardChatActivity(userId);
        const explorerAchievement = await checkExplorerAchievement(userId);
        
        if (explorerAchievement) {
          gamificationReward.newAchievements.push(explorerAchievement);
        }

        res.json({ 
          ...savedResponse, 
          gamification: gamificationReward 
        });
      } catch (gamificationError) {
        console.error("Gamification update failed:", gamificationError);
        res.json(savedResponse); // Return chat without gamification data
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Clear chat history
  app.delete("/api/chat/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.clearChatMessages(userId);
      res.json({ message: "Chat history cleared successfully" });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ error: "Failed to clear chat history" });
    }
  });

  // Generate speech with ElevenLabs
  app.post("/api/speech", async (req, res) => {
    try {
      const { text, toneMode, language } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const audioBuffer = await generateSpeechWithElevenLabs(
        text,
        toneMode || 'sweet-nurturing',
        language || 'en'
      );

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error("Speech generation error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // Image generation routes
  app.get("/api/images/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const images = await storage.getGeneratedImages(userId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const images = await storage.getGeneratedImages(userId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/images/generate", rateLimitMiddleware('/api/images'), async (req, res) => {
    try {
      const { userId, prompt, language = 'en' } = req.body;
      
      if (!userId || !prompt) {
        return res.status(400).json({ error: "User ID and prompt are required" });
      }

      // Content moderation check
      const moderationResult = await moderateContent(prompt.trim(), 'image_prompt', userId);
      if (!moderationResult.isAllowed) {
        return res.status(400).json({ 
          error: "Image prompt blocked by content filter",
          reason: moderationResult.flagReason,
          message: "Please try a different image idea."
        });
      }

      // Generate image first (this usually works)
      const result = await generateImage(prompt, language);
      
      // Try to save with retry logic for database issues
      let savedImage;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          savedImage = await storage.createGeneratedImage({
            userId,
            prompt,
            imageUrl: result.url,
            language
          });
          break; // Success, exit retry loop
        } catch (dbError: any) {
          retryCount++;
          console.error(`Database save attempt ${retryCount} failed:`, dbError);
          
          if (retryCount >= maxRetries) {
            // If database save fails, still return the image URL
            console.warn("Database save failed after retries, returning image without saving");
            return res.json({
              id: Date.now(), // Temporary ID
              userId,
              prompt,
              imageUrl: result.url,
              language,
              createdAt: new Date().toISOString(),
              warning: "Image generated but not saved to database"
            });
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Try to award points, but don't fail if this doesn't work
      try {
        const gamificationReward = await rewardImageGeneration(userId);
        const explorerAchievement = await checkExplorerAchievement(userId);
        
        if (explorerAchievement) {
          gamificationReward.newAchievements.push(explorerAchievement);
        }

        res.json({ 
          ...savedImage, 
          gamification: gamificationReward 
        });
      } catch (gamificationError) {
        console.error("Gamification update failed:", gamificationError);
        res.json(savedImage); // Return image without gamification data
      }
      
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Video script routes
  app.get("/api/scripts/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const scripts = await storage.getVideoScripts(userId);
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  app.post("/api/scripts/generate", rateLimitMiddleware('/api/scripts'), async (req, res) => {
    try {
      const { userId, topic, platform, language = 'en', toneMode = 'sweet-nurturing', responseMode = 'detailed' } = req.body;
      
      if (!userId || !topic || !platform) {
        return res.status(400).json({ error: "User ID, topic, and platform are required" });
      }

      // Content moderation check
      const moderationResult = await moderateContent(topic.trim(), 'script', userId);
      if (!moderationResult.isAllowed) {
        return res.status(400).json({ 
          error: "Script topic blocked by content filter",
          reason: moderationResult.flagReason,
          message: "Please choose a different topic for your video script."
        });
      }

      const personality: BonitaPersonality = {
        language: language as 'en' | 'es' | 'pt' | 'fr',
        toneMode: toneMode as 'sweet-nurturing' | 'tough-love',
        responseMode: responseMode as 'quick' | 'detailed'
      };

      const scriptText = await generateVideoScript(topic, platform, language, personality);
      
      const savedScript = await storage.createVideoScript({
        userId,
        topic,
        platform,
        script: scriptText,
        language
      });

      // Award gamification points and check achievements
      const gamificationReward = await rewardScriptCreation(userId);
      const explorerAchievement = await checkExplorerAchievement(userId);
      
      if (explorerAchievement) {
        gamificationReward.newAchievements.push(explorerAchievement);
      }

      res.json({ 
        ...savedScript, 
        gamification: gamificationReward 
      });
    } catch (error) {
      console.error("Script generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate script",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Voice transcription route
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file is required" });
      }

      const transcription = await transcribeAudio(req.file.buffer);
      res.json({ transcription });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Waitlist signup route
  app.post("/api/waitlist", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const waitlistEntry = await storage.addToWaitlist({ email: email.toLowerCase().trim() });
      res.json({ success: true, id: waitlistEntry.id });
    } catch (error: any) {
      console.error("Waitlist signup error:", error);
      
      // Handle duplicate email error
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(200).json({ success: true, message: "Email already registered" });
      }
      
      res.status(500).json({ error: "Failed to join waitlist" });
    }
  });

  // Analytics and Support Routes
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const event = req.body;
      await trackEvent({
        ...event,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Analytics tracking error:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const metrics = await getAnalyticsMetrics(days);
      res.json(metrics);
    } catch (error) {
      console.error("Analytics metrics error:", error);
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });

  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticket = await createSupportTicket(req.body);
      res.json(ticket);
    } catch (error) {
      console.error("Support ticket creation error:", error);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  app.get("/api/support/tickets", async (req, res) => {
    try {
      const status = req.query.status as string;
      const tickets = await getSupportTickets(status);
      res.json(tickets);
    } catch (error) {
      console.error("Support tickets fetch error:", error);
      res.status(500).json({ error: "Failed to get support tickets" });
    }
  });

  // Admin authentication route
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      
      // Use environment variable for admin password, fallback to default for development
      const adminPassword = process.env.ADMIN_PASSWORD || 'bonita2025';
      
      if (password === adminPassword) {
        res.json({ success: true, message: "Authenticated" });
      } else {
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
