import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Configure Google OAuth Strategy
export function configureGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return;
  }

  const callbackURL = process.env.NODE_ENV === 'production' 
    ? "https://heybonita.ai/auth/google/callback"
    : "https://hey-bonita.replit.app/auth/google/callback";

  console.log('Configuring Google OAuth strategy');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 15) + '...');
  console.log('Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
  console.log('Using Google OAuth callback URL:', callbackURL);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (user) {
        return done(null, user);
      }

      // Check if user exists with this email
      if (profile.emails && profile.emails[0]) {
        const existingUser = await storage.getUserByUsername(profile.emails[0].value);
        if (existingUser) {
          // Link Google account to existing user
          const updatedUser = await storage.updateUser(existingUser.id, {
            googleId: profile.id,
            provider: 'google'
          });
          return done(null, updatedUser);
        }
      }

      // Create new user
      const newUser = await storage.createUser({
        username: profile.emails?.[0]?.value || `google_${profile.id}`,
        email: profile.emails?.[0]?.value || null,
        googleId: profile.id,
        provider: 'google'
      });

      return done(null, newUser);
    } catch (error) {
      return done(error, undefined);
    }
  }));
}

// Configure Apple OAuth Strategy
export function configureAppleAuth() {
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
    console.warn('Apple OAuth not configured - missing required Apple credentials');
    return;
  }

  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    callbackURL: "/auth/apple/callback",
    scope: ['name', 'email']
  },
  async (accessToken, refreshToken, idToken, profile, done) => {
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

// Serialize/deserialize user for session
export function configureSession() {
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
}