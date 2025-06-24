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
import { z } from "zod";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
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

  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, message, language = 'en', toneMode = 'sweet-nurturing' } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "User ID and message are required" });
      }

      // Save user message
      await storage.createChatMessage({
        userId,
        role: 'user',
        content: message,
        language,
        toneMode
      });

      // Get chat history for context
      const chatHistory = await storage.getChatMessages(userId, 10);
      const historyFormatted = chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Get Bonita's response
      const personality: BonitaPersonality = {
        language: language as 'en' | 'es' | 'pt' | 'fr',
        toneMode: toneMode as 'sweet-nurturing' | 'tough-love'
      };

      const bonitaResponse = await chatWithBonita(message, personality, historyFormatted);

      // Save Bonita's response
      const savedResponse = await storage.createChatMessage({
        userId,
        role: 'assistant',
        content: bonitaResponse,
        language,
        toneMode
      });

      res.json(savedResponse);
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

  app.post("/api/images/generate", async (req, res) => {
    try {
      const { userId, prompt, language = 'en' } = req.body;
      
      if (!userId || !prompt) {
        return res.status(400).json({ error: "User ID and prompt are required" });
      }

      const result = await generateImage(prompt, language);
      
      const savedImage = await storage.createGeneratedImage({
        userId,
        prompt,
        imageUrl: result.url,
        language
      });

      res.json(savedImage);
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

  app.post("/api/scripts/generate", async (req, res) => {
    try {
      const { userId, topic, platform, language = 'en', toneMode = 'sweet-nurturing' } = req.body;
      
      if (!userId || !topic || !platform) {
        return res.status(400).json({ error: "User ID, topic, and platform are required" });
      }

      const personality: BonitaPersonality = {
        language: language as 'en' | 'es' | 'pt' | 'fr',
        toneMode: toneMode as 'sweet-nurturing' | 'tough-love'
      };

      const script = await generateVideoScript(topic, platform, language, personality);
      
      const savedScript = await storage.createVideoScript({
        userId,
        topic,
        platform,
        script,
        language
      });

      res.json(savedScript);
    } catch (error) {
      console.error("Script generation error:", error);
      res.status(500).json({ error: "Failed to generate script" });
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

  const httpServer = createServer(app);
  return httpServer;
}
