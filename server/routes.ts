import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
import { storage } from "./storage";
import { pool } from "./db";
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
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";

const upload = multer({ storage: multer.memoryStorage() });

// Configure OAuth strategies
function configureOAuthStrategies() {
  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Configuring Google OAuth strategy');
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    // Use the actual deployment URL - check if we're on deployed Replit
    const isDeployed = process.env.REPLIT_DEPLOYMENT === 'true' || process.env.RAILWAY_ENVIRONMENT;
    const deploymentDomain = process.env.REPLIT_DOMAINS?.split(',')[0] || '144ee532-ec99-4997-9ea5-5404cbf92117-00-1uqlcgy3yn9y6.worf.replit.dev';
    
    let callbackURL;
    if (process.env.NODE_ENV === 'production') {
      callbackURL = 'https://heybonita.ai/auth/google/callback';
    } else if (isDeployed) {
      // Use deployment URL
      callbackURL = `https://${deploymentDomain}/auth/google/callback`;
    } else {
      // Use development URL
      callbackURL = `https://${deploymentDomain}/auth/google/callback`;
    }
    
    console.log('Using callback URL:', callbackURL);
    
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth strategy callback triggered');
        console.log('Profile received:', {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          photos: profile.photos
        });
        
        // Check if user already exists with this Google ID
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (user) {
          console.log('Found existing user with Google ID:', user.id);
          return done(null, user);
        }

        // Check if user exists with this email
        if (profile.emails && profile.emails[0]) {
          const email = profile.emails[0].value;
          console.log('Checking for existing user with email:', email);
          const existingUser = await storage.getUserByUsername(email);
          if (existingUser) {
            console.log('Linking Google account to existing user:', existingUser.id);
            // Link Google account to existing user
            const updatedUser = await storage.updateUser(existingUser.id, {
              googleId: profile.id,
              provider: 'google'
            });
            return done(null, updatedUser);
          }
        }

        console.log('Creating new user from Google profile');
        // Create new user with proper data
        const userData = {
          username: profile.emails?.[0]?.value || `google_${profile.id}`,
          email: profile.emails?.[0]?.value || null,
          googleId: profile.id,
          provider: 'google',
          // Add default values for required fields
          passwordHash: null, // OAuth users don't need password
          language: 'en',
          theme: 'dark',
          colorScheme: 'red',
          toneMode: 'sweet-nurturing'
        };
        
        const newUser = await storage.createUser(userData);
        console.log('New user created:', newUser.id);

        return done(null, newUser);
      } catch (error) {
        console.error('Google OAuth strategy error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        return done(error, null);
      }
    }));
  } else {
    console.log('Google OAuth credentials not found in environment');
  }

  // Apple OAuth Strategy
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      callbackURL: "/auth/apple/callback",
      scope: ['name', 'email']
    },
    async (accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
      try {
        // Apple ID is in the 'sub' field of the profile
        const appleId = profile.id || profile.sub;
        
        // Check if user already exists with this Apple ID
        let user = await storage.getUserByAppleId(appleId);
        
        if (user) {
          return done(null, user);
        }

        // Check if user exists with this email
        if (profile.email) {
          const existingUser = await storage.getUserByUsername(profile.email);
          if (existingUser) {
            // Link Apple account to existing user
            const updatedUser = await storage.updateUser(existingUser.id, {
              appleId: appleId,
              provider: 'apple'
            });
            return done(null, updatedUser);
          }
        }

        // Create new user
        const newUser = await storage.createUser({
          username: profile.email || `apple_${appleId}`,
          email: profile.email || null,
          appleId: appleId,
          provider: 'apple'
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    }));
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Trust proxy for correct HTTPS detection
  app.set('trust proxy', true);
  
  // Force HTTPS protocol detection middleware
  app.use((req, res, next) => {
    // Force HTTPS for OAuth callbacks on Replit
    if (req.get('Host')?.includes('replit.dev')) {
      // Override the protocol getter to return 'https'
      Object.defineProperty(req, 'protocol', {
        value: 'https',
        writable: false,
        configurable: true
      });
      Object.defineProperty(req, 'secure', {
        value: true,
        writable: false,
        configurable: true
      });
    }
    next();
  });

  // Session configuration for authentication
  const sessionStore = new (connectPgSimple(session))({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    errorLog: (error: any) => {
      console.error('Session store error:', error);
    }
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'bonita-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, // Set to false for now to ensure sessions work in development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Important for cross-origin requests
    },
    name: 'bonita.session' // Custom session name
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure OAuth strategies
  configureOAuthStrategies();

  // OAuth Routes - Google
  app.get('/auth/google', (req, res, next) => {
    console.log('Google OAuth initiated');
    console.log('User-Agent:', req.get('User-Agent'));
    console.log('Referer:', req.get('Referer'));
    console.log('Host:', req.get('Host'));
    console.log('Protocol:', req.protocol);
    console.log('Full URL would be:', `https://${req.get('Host')}/auth/google/callback`);
    
    try {
      passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account',
        accessType: 'offline'
      })(req, res, next);
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      res.redirect('/auth?error=oauth_init_failed');
    }
  });

  // Test route to debug OAuth redirect manually
  app.get('/auth/google/test', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent('https://144ee532-ec99-4997-9ea5-5404cbf92117-00-1uqlcgy3yn9y6.worf.replit.dev/auth/google/callback');
    const scope = encodeURIComponent('profile email');
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=select_account`;
    
    console.log('Manual Google OAuth URL:', googleAuthUrl);
    res.redirect(googleAuthUrl);
  });

  app.get('/auth/google/callback', (req, res, next) => {
    console.log('Google OAuth callback route hit');
    console.log('Query params:', req.query);
    console.log('Session before auth:', req.session);
    
    if (req.query.error) {
      console.log('Google OAuth error in query:', req.query.error);
      return res.redirect('/auth?error=oauth_failed');
    }
    
    passport.authenticate('google', (err, user, info) => {
      console.log('Passport authenticate result:', { 
        error: err, 
        userExists: !!user, 
        userDetails: user ? { id: user.id, email: user.email } : null,
        info 
      });
      
      if (err) {
        console.error('OAuth authentication error:', err);
        return res.redirect('/auth?error=oauth_error');
      }
      
      if (!user) {
        console.log('No user returned from OAuth strategy');
        return res.redirect('/auth?error=oauth_failed');
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('req.logIn error:', loginErr);
          return res.redirect('/auth?error=login_failed');
        }
        
        console.log('User successfully logged in via Google:', user.id);
        (req.session as any).userId = user.id;
        console.log('Session after login:', req.session);
        return res.redirect('/');
      });
    })(req, res, next);
  });

  // Test login endpoint for OAuth debugging
  app.post('/api/test-login', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }
      
      let user = await storage.getUserByUsername(email);
      
      if (!user) {
        user = await storage.createUser({
          username: email,
          email: email,
          passwordHash: 'test-user',
          provider: 'test'
        });
      }
      
      if (req.session) {
        (req.session as any).userId = user.id;
      }
      
      res.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ error: 'Failed to create test user' });
    }
  });

  // OAuth Routes - Apple (Disabled - requires Apple Developer credentials)
  app.get('/auth/apple', (req, res) => {
    res.status(503).json({ 
      error: 'Apple Sign In is temporarily unavailable',
      message: 'Please use Google Sign In or create an account with email/password'
    });
  });

  app.get('/auth/apple/callback', (req, res) => {
    res.redirect('/app?error=apple_unavailable');
  });
  
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
      
      // Create session for new user
      if (req.session) {
        req.session.userId = user.id;
        console.log('Registration successful - Session created:', { 
          sessionId: req.sessionID, 
          userId: user.id,
          username: user.username 
        });
        
        // Force session save
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Registration session save error:', err);
              reject(err);
            } else {
              console.log('Registration session saved successfully');
              resolve(true);
            }
          });
        });
      }
      
      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, message: "Account created successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Test password verification
  app.post("/api/test-password", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Testing password for:', username);
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return res.json({ error: "User not found or no password" });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log('Password valid:', isValid);
      
      res.json({ 
        userExists: !!user,
        hasPassword: !!user.passwordHash,
        passwordValid: isValid,
        userId: user.id
      });
    } catch (error) {
      console.error('Password test error:', error);
      res.json({ error: error.message });
    }
  });

  // Create a completely non-API route to bypass Vite
  app.post("/auth-login", async (req, res) => {
    console.log('=== LOGIN ATTEMPT (BYPASS ROUTE) ===');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Request body:', req.body);
    console.log('Raw body type:', typeof req.body);
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    
    try {
      const { username, password } = req.body;
      
      console.log('Username:', username);
      console.log('Password provided:', !!password);
      
      if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        console.log('User not found or no password hash');
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log('Password verification failed');
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Create session
      if (req.session) {
        req.session.userId = user.id;
        console.log('Login successful - Session created:', { 
          sessionId: req.sessionID, 
          userId: user.id,
          username: user.username 
        });
        
        // Force session save
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              reject(err);
            } else {
              console.log('Session saved successfully');
              resolve(true);
            }
          });
        });
      }
      
      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      console.log('Login completed successfully for user:', userWithoutPassword.username);
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Keep the original route for backward compatibility but add debugging
  app.post("/api/auth/login", async (req, res) => {
    console.log('=== ORIGINAL LOGIN ROUTE - DEBUGGING ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    
    // Redirect to working route
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
      
      // Create session
      if (req.session) {
        req.session.userId = user.id;
        
        // Force session save
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              reject(err);
            } else {
              console.log('Session saved successfully via original route');
              resolve(true);
            }
          });
        });
      }
      
      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Session debug endpoint
  app.get("/api/debug/session", (req, res) => {
    res.json({
      sessionExists: !!req.session,
      sessionId: req.sessionID,
      userId: req.session?.userId,
      isAuthenticated: req.isAuthenticated?.(),
      userExists: !!req.user,
      sessionData: req.session
    });
  });

  // Authentication status endpoint
  app.get("/api/auth/status", async (req, res) => {
    console.log('Auth status check - Session exists:', !!req.session);
    console.log('Auth status check - Session userId:', req.session?.userId);
    console.log('Auth status check - Is authenticated:', req.isAuthenticated?.());
    
    // Check both session and passport authentication
    if ((req.session && req.session.userId) || req.isAuthenticated?.()) {
      try {
        let userId = req.session?.userId;
        
        // If no userId in session but passport is authenticated, try to get it
        if (!userId && req.user && typeof req.user === 'object' && 'id' in req.user) {
          userId = (req.user as any).id;
          // Save userId to session for future requests
          if (req.session) {
            req.session.userId = userId;
          }
        }
        
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            const { passwordHash, ...userWithoutPassword } = user;
            console.log('Auth status check - User found:', userWithoutPassword.username);
            res.json({ 
              authenticated: true, 
              user: userWithoutPassword 
            });
            return;
          }
        }
        
        console.log('Auth status check - No user found, destroying session');
        req.session?.destroy(() => {});
        res.json({ authenticated: false });
      } catch (error) {
        console.error('Auth status check error:', error);
        res.json({ authenticated: false });
      }
    } else {
      console.log('Auth status check - Not authenticated');
      res.json({ authenticated: false });
    }
  });

  // Logout endpoint - support both GET and POST
  const logoutHandler = (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        // Redirect to app route which will show Auth component when no user is authenticated
        res.redirect('/app');
      });
    } else {
      res.redirect('/app');
    }
  };
  
  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);

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
      const requestedUserId = parseInt(req.params.userId);
      const sessionUserId = req.session?.userId;
      
      // Only allow users to access their own chat history
      if (!sessionUserId || sessionUserId !== requestedUserId) {
        return res.status(401).json({ error: "Not authenticated or unauthorized" });
      }
      
      const messages = await storage.getChatMessages(requestedUserId);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  app.post("/api/chat", rateLimitMiddleware('/api/chat'), async (req, res) => {
    try {
      const { message, language = 'en', toneMode = 'sweet-nurturing', responseMode = 'detailed' } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
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
      const { prompt, language = 'en' } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
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
      const { topic, platform, language = 'en', toneMode = 'sweet-nurturing', responseMode = 'detailed' } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!topic || !platform) {
        return res.status(400).json({ error: "Topic and platform are required" });
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

  // Feedback submission
  app.post('/api/feedback', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const { feedbackType, feedbackText, rating, page, userAgent } = req.body;
      
      const feedback = await storage.createFeedback({
        userId: req.session.userId,
        feedbackType,
        feedbackText,
        rating,
        page,
        userAgent
      });

      // Track feedback submission for analytics
      await trackEvent({
        sessionId: req.sessionID || 'unknown',
        eventType: 'feedback_submitted',
        userId: req.session.userId,
        eventData: JSON.stringify({ 
          feedbackType, 
          page,
          hasText: !!feedbackText,
          hasRating: !!rating
        }),
        userAgent: req.get('User-Agent') || 'unknown',
        ipAddress: req.ip || 'unknown'
      });

      res.json(feedback);
    } catch (error) {
      console.error('Feedback submission error:', error);
      res.status(500).json({ message: 'Failed to submit feedback' });
    }
  });

  // Get all feedback (admin only)
  app.get('/api/feedback', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      // Simple admin check - you might want to implement proper role-based access
      const user = await storage.getUser(req.session.userId);
      if (user?.email !== 'cj@contentcreator.ai') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const feedback = await storage.getFeedback();
      res.json(feedback);
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: 'Failed to get feedback' });
    }
  });

  // Receipts system routes
  app.get("/api/receipts", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const { type, project, folderId, limit } = req.query;
      const receipts = await storage.getReceipts(
        req.session.userId, 
        type as string, 
        project as string,
        folderId ? parseInt(folderId as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(receipts);
    } catch (error) {
      console.error("Receipts fetch error:", error);
      res.status(500).json({ error: "Failed to fetch receipts" });
    }
  });

  app.post("/api/receipts", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const receiptData = { ...req.body, userId: req.session.userId };
      const receipt = await storage.createReceipt(receiptData);
      res.json(receipt);
    } catch (error) {
      console.error("Receipt creation error:", error);
      res.status(500).json({ error: "Failed to create receipt" });
    }
  });

  app.put("/api/receipts/:id", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const receiptId = parseInt(req.params.id);
      const receipt = await storage.updateReceipt(receiptId, req.body);
      res.json(receipt);
    } catch (error) {
      console.error("Receipt update error:", error);
      res.status(500).json({ error: "Failed to update receipt" });
    }
  });

  app.delete("/api/receipts/:id", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const receiptId = parseInt(req.params.id);
      await storage.deleteReceipt(receiptId);
      res.json({ success: true });
    } catch (error) {
      console.error("Receipt deletion error:", error);
      res.status(500).json({ error: "Failed to delete receipt" });
    }
  });

  // Receipt folder management routes
  app.get("/api/receipt-folders", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const folders = await storage.getReceiptFolders(req.session.userId);
      res.json(folders);
    } catch (error) {
      console.error("Receipt folders fetch error:", error);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });

  app.post("/api/receipt-folders", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const { name, color, description } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ message: 'Folder name is required' });
      }
      
      const folder = await storage.createReceiptFolder({
        userId: req.session.userId,
        name: name.trim(),
        color: color || 'blue',
        description: description?.trim() || null
      });
      res.json(folder);
    } catch (error) {
      console.error("Receipt folder creation error:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  app.put("/api/receipt-folders/:id", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const folderId = parseInt(req.params.id);
      const { name, color, description, archived } = req.body;
      
      const updatedFolder = await storage.updateReceiptFolder(folderId, {
        name: name?.trim(),
        color,
        description: description?.trim() || null,
        isArchived: archived
      });
      res.json(updatedFolder);
    } catch (error) {
      console.error("Receipt folder update error:", error);
      res.status(500).json({ error: "Failed to update folder" });
    }
  });

  app.delete("/api/receipt-folders/:id", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const folderId = parseInt(req.params.id);
      await storage.deleteReceiptFolder(folderId);
      res.json({ success: true });
    } catch (error) {
      console.error("Receipt folder deletion error:", error);
      res.status(500).json({ error: "Failed to delete folder" });
    }
  });

  app.post("/api/receipts/:id/move", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const receiptId = parseInt(req.params.id);
      const { folderId } = req.body;
      
      const updatedReceipt = await storage.moveReceiptToFolder(
        receiptId, 
        folderId === null ? null : parseInt(folderId)
      );
      res.json(updatedReceipt);
    } catch (error) {
      console.error("Receipt move error:", error);
      res.status(500).json({ error: "Failed to move receipt" });
    }
  });

  // Conversation Projects routes
  app.get("/api/projects", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const projects = await storage.getConversationProjects(req.session.userId);
      res.json(projects);
    } catch (error) {
      console.error("Projects fetch error:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const projectData = { ...req.body, userId: req.session.userId };
      const project = await storage.createConversationProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Dropped Ideas routes
  app.get("/api/dropped-ideas", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const { projectId, limit } = req.query;
      const ideas = await storage.getDroppedIdeas(
        req.session.userId, 
        projectId ? parseInt(projectId as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(ideas);
    } catch (error) {
      console.error("Dropped ideas fetch error:", error);
      res.status(500).json({ error: "Failed to fetch dropped ideas" });
    }
  });

  app.post("/api/dropped-ideas", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const ideaData = { ...req.body, userId: req.session.userId };
      const idea = await storage.createDroppedIdea(ideaData);
      res.json(idea);
    } catch (error) {
      console.error("Dropped idea creation error:", error);
      res.status(500).json({ error: "Failed to create dropped idea" });
    }
  });

  app.put("/api/dropped-ideas/:id/rediscover", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const ideaId = parseInt(req.params.id);
      const idea = await storage.markIdeaRediscovered(ideaId);
      res.json(idea);
    } catch (error) {
      console.error("Idea rediscovery error:", error);
      res.status(500).json({ error: "Failed to mark idea as rediscovered" });
    }
  });

  // Commitments routes
  app.get("/api/commitments", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const { status, limit } = req.query;
      const commitments = await storage.getCommitments(
        req.session.userId,
        status as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(commitments);
    } catch (error) {
      console.error("Commitments fetch error:", error);
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  app.post("/api/commitments", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const commitmentData = { ...req.body, userId: req.session.userId };
      const commitment = await storage.createCommitment(commitmentData);
      res.json(commitment);
    } catch (error) {
      console.error("Commitment creation error:", error);
      res.status(500).json({ error: "Failed to create commitment" });
    }
  });

  app.put("/api/commitments/:id", async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const commitmentId = parseInt(req.params.id);
      const commitment = await storage.updateCommitment(commitmentId, req.body);
      res.json(commitment);
    } catch (error) {
      console.error("Commitment update error:", error);
      res.status(500).json({ error: "Failed to update commitment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
