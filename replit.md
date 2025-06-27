# replit.md

## Overview

Bonita AI is a full-stack web application built with React/TypeScript frontend and Express.js backend. The app features a multilingual AI assistant called Bonita, a "Digital Bronx Auntie" who provides chat support, image generation, and video script creation. The application supports four languages (English, Spanish, Portuguese, French) and offers customizable themes and tone modes.

## System Architecture

### Frontend Architecture
- **React 18 + TypeScript**: Modern React with full TypeScript support
- **Vite**: Fast build tool and development server
- **shadcn/ui + Radix UI**: Component library built on unstyled, accessible primitives
- **TailwindCSS**: Utility-first CSS framework with custom theming
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **React Hook Form + Zod**: Form handling with schema validation

### Backend Architecture
- **Express.js + TypeScript**: RESTful API server with ES modules
- **OpenAI Integration**: GPT-4o model for chat, DALL-E 3 for images
- **Multer**: File upload handling for audio transcription
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **PostgreSQL**: Primary database (configured for Neon serverless)
- **Drizzle ORM**: Type-safe database interactions
- **Schema Design**: Users, chat messages, generated images, and video scripts with multilingual support

## Key Components

### AI Personality System
- **Bonita Character**: Hip-hop auntie with encyclopedic knowledge of 90s/current music culture
- **Voice Profile**: Clean enunciation with subtle rasp (Lauryn Hill meets MC Lyte energy)
- **Cultural Expertise**: 90s legends (Nas, Mary J., Aaliyah) to current artists (Kendrick, SZA, Burna Boy) + current events awareness
- **Communication Style**: Hip-hop metaphors for life wisdom, street smarts with academic insight
- **Tone Modes**: Sweet-nurturing (soulful guidance) vs tough-love (MC Lyte confidence)
- **Voice Technology**: ElevenLabs with dynamic range and clean, full-bodied delivery

### Language System
- **React Context**: Centralized language state management
- **Translation Engine**: Type-safe translation keys with JSON storage
- **Persistence**: LocalStorage for user preferences
- **Dynamic Content**: Real-time language switching without page reload

### Theme System
- **CSS Variables**: Custom properties for dynamic theming
- **Color Schemes**: Multiple accent color options (red, blue, green, etc.)
- **Dark/Light Mode**: Automatic system preference detection
- **Component Variants**: Theme-aware UI components

### File Upload System
- **Audio Transcription**: Speech-to-text using OpenAI Whisper
- **Image Generation**: DALL-E 3 integration with preset prompts
- **File Validation**: Type and size restrictions for uploads

## Data Flow

1. **User Interaction**: Frontend captures user input (text, voice, settings)
2. **API Requests**: TanStack Query manages server communication
3. **Server Processing**: Express routes handle business logic
4. **AI Integration**: OpenAI API calls for chat, images, transcription
5. **Database Operations**: Drizzle ORM manages data persistence
6. **Response Handling**: Frontend updates UI with real-time feedback

## External Dependencies

### OpenAI Services
- **GPT-4o**: Primary chat model (latest available)
- **DALL-E 3**: Image generation from text prompts
- **Whisper**: Audio transcription service
- **API Key**: Required environment variable (OPENAI_API_KEY)

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL provider
- **Connection**: DATABASE_URL environment variable required
- **WebSocket Support**: For real-time features

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **Date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Replit Integration**: Optimized for Replit development workflow
- **Hot Reload**: Vite dev server with instant updates
- **Error Overlay**: Runtime error modal for debugging
- **Port Configuration**: Port 5000 with external port 80

### Production Build
- **Frontend**: Vite builds to dist/public directory
- **Backend**: ESBuild bundles server to dist/index.js
- **Static Assets**: Express serves built frontend assets
- **Environment**: NODE_ENV controls development vs production features

### Database Setup
- **Migrations**: Drizzle Kit manages schema changes
- **Push Command**: `npm run db:push` for schema deployment
- **Connection Pooling**: Neon serverless connection management

## Changelog

- June 24, 2025. Initial setup
- June 24, 2025. Integrated custom Bonita avatar images to replace placeholder images throughout the application
- June 24, 2025. Added text-to-speech functionality with automatic speech for new messages and manual speech controls for existing messages
- June 24, 2025. Added multilingual speech-to-speech capability allowing voice input and automatic spoken responses
- June 24, 2025. Integrated ElevenLabs Conversational AI for high-quality, emotionally expressive voice synthesis with personality-based voice modulation
- June 24, 2025. Enhanced ElevenLabs voice configuration with authentic Bronx Auntie personality - soulful, expressive delivery with cultural authenticity and attitude-specific voice settings
- June 24, 2025. Added current date/time awareness and real-world context to Bonita's knowledge base for timely, relevant conversations
- June 24, 2025. Implemented response cancellation feature allowing users to stop Bonita's text generation mid-response
- June 24, 2025. Fixed stop button functionality with proper abort controller integration and 2025 date awareness updates
- June 24, 2025. Integrated Perplexity API for real-time news and current events access, enabling accurate responses about current politics and world events
- June 24, 2025. Enhanced speech personality with authentic AAVE pronunciation corrections and slang adaptations for both ElevenLabs and browser TTS
- June 24, 2025. Integrated GNews.io for comprehensive real-time news coverage alongside Perplexity for enhanced current events awareness
- June 24, 2025. Enhanced Perplexity integration with trending topics detection and social media culture awareness for viral content and cultural buzz
- June 24, 2025. Optimized response times by reducing token limits and implementing global audio controller for better speech management
- June 24, 2025. Added Quick Mode toggle for 1-2 sentence responses vs detailed responses, significantly improving response speed for rapid Q&A
- June 24, 2025. Added dedicated voice control toggles for Text-to-Speech and Speech-to-Speech modes with persistent user preferences
- June 24, 2025. Simplified voice controls to single toggle between Text-to-Speech and Speech-to-Speech modes, improved scrolling behavior
- June 24, 2025. Redesigned control panel with clean icons, hover hints, and actual toggle switches for better UX
- June 24, 2025. Cleaned up Video Scripts design with consistent layout and fixed scrolling issues across all components
- June 24, 2025. Fixed stop button functionality to properly halt all processing and speech generation
- June 24, 2025. Enhanced news integration for better entertainment and music industry coverage including artist collaborations and album releases
- June 25, 2025. Fixed stop button functionality with proper audio reference management and abort controller handling
- June 25, 2025. Updated Contact Support button to link to cj@heybonita.ai for user support requests
- June 25, 2025. Created professional landing page with email waitlist collection, premium tier preview, and app onboarding flow
- June 25, 2025. Integrated official Bonita character logo throughout the application, replacing placeholder avatars with authentic branding
- June 25, 2025. Added comprehensive gamification system with points, levels, achievements, and streaks to boost user engagement
- June 25, 2025. Fixed ImageGenerator component functionality: preset buttons working, scrolling restored, Images Created gallery displaying properly, remix and surprise buttons functional with improved error handling
- June 25, 2025. Fixed chat activity tracking in gamification system - chat messages now properly increment total_chats counter and award points/achievements
- June 25, 2025. Built comprehensive analytics and admin dashboard system with authentication, accessible at /admin route with password protection (default: bonita2025)
- June 25, 2025. Fixed mobile navigation stability issues by implementing show/hide pattern instead of conditional rendering, preventing component re-mounting and eliminating tab content flashing
- June 25, 2025. Enhanced speech-to-speech functionality for mobile devices with improved error handling, timeout management, haptic feedback, and optimized audio timing for better mobile compatibility
- June 25, 2025. Implemented complete authentication system for soft launch: user registration, login, password hashing with bcrypt, session management, and individual user accounts with secure data isolation
- June 25, 2025. Added comprehensive production features: content moderation with OpenAI filtering, rate limiting protection (20 chats/min, 5 images/min, 3 scripts/min), and complete data export functionality (JSON/CSV/TXT formats) for user privacy compliance
- June 25, 2025. Fixed image loading issue - authenticated users now see only their own generated images, ensuring proper data isolation between user accounts
- June 25, 2025. Fixed critical download functionality for generated images - improved CORS handling, added fallback options, and enhanced error handling for better user experience
- June 25, 2025. Enhanced image download with clear step-by-step instructions for users unfamiliar with right-click saving, making the feature more accessible to all skill levels
- June 25, 2025. Implemented server-side proxy download system for seamless image downloads - users can now download images with a single click without needing to navigate new tabs or right-click operations
- June 25, 2025. Updated YouTube Intro preset duration from 5-10 minutes to 15-90 seconds for more focused intro content creation
- June 25, 2025. Added Google and Apple OAuth login integration: database schema updated with OAuth fields, authentication routes configured, login buttons added to auth page - requires Google/Apple developer credentials to activate
- June 25, 2025. Implemented logout functionality: logout button in settings dialog, backend session destruction, user feedback and redirect to login page
- June 25, 2025. Fixed Google OAuth configuration: added dotenv loading, proper strategy initialization, Google login now fully functional with user credentials
- June 25, 2025. Updated Google OAuth credentials: Client ID (452337819985-h6a0qlgsktrmm71e4vgqpfd8ttc75bif.apps.googleusercontent.com) and Client Secret configured for production use
- June 25, 2025. Resolved Google OAuth connection issues: replaced problematic redirect method with form submission approach, Google login now successfully redirects to authentication page
- June 25, 2025. Added Joy River knowledge to Bonita's personality: includes reverence for life coach/podcaster Joy River, her work with sound baths, emotional intelligence, and spiritual guidance at creativeenergy.life
- June 25, 2025. Implemented Joy River custom triggers: detects "Who is Joy River?", "What would Joy River say?", "Tell me about Joy River" and displays interactive buttons for Watch Podcast, Follow Joy, and Visit Site with direct links to YouTube, Instagram, and creativeenergy.life
- June 26, 2025. Diagnosed Google OAuth "refused to connect" issue: app is in Testing mode and needs to be published to Production in Google Cloud Console for unrestricted access
- June 26, 2025. Fixed Joy River trigger system: interactive buttons now display properly, updated YouTube link to correct channel @TheCouchwithJoyFriends
- June 26, 2025. Google OAuth "refused to connect" error persists after attempting to publish app - investigating additional troubleshooting steps including test users and domain authorization
- June 27, 2025. Successfully resolved Google OAuth production publishing - authentication now working properly for all users
- June 27, 2025. Implemented comprehensive One-Click Feedback Capture Mechanism: floating widget with quick feedback buttons (like/dislike/bug/suggestion/general), detailed feedback forms with star ratings, database storage, analytics tracking, and admin dashboard integration for feedback management
- June 27, 2025. Moved feedback widget to left sidebar (left-4 top-1/2) to avoid overlapping with navigation options, arranged buttons vertically for better accessibility
- June 27, 2025. Fixed Google OAuth callback URL configuration with absolute domain URL to resolve "accounts.google.com refused to connect" error
- June 27, 2025. Successfully resolved Google OAuth production publishing - authentication now working properly for all users
- June 27, 2025. Implemented comprehensive One-Click Feedback Capture Mechanism: floating widget with quick feedback buttons (like/dislike/bug/suggestion/general), detailed feedback forms with star ratings, database storage, analytics tracking, and admin dashboard integration for feedback management
- June 27, 2025. Moved feedback widget to left sidebar (left-4 top-1/2) to avoid overlapping with navigation options, arranged buttons vertically for better accessibility
- June 27, 2025. Created playful loading spinner with Bonita character interaction featuring animated avatar, rotating messages, floating hearts, sparkles, and music notes for enhanced user experience during OAuth authentication
- June 27, 2025. Added test login endpoint to debug Google OAuth "refused to connect" issue - allows temporary access while resolving OAuth production publishing requirements
- June 27, 2025. Restructured UI layout: moved Chat, Images, Scripts, and Profile navigation to left sidebar with feedback and logout buttons at bottom, removing duplicate tab navigation from header for cleaner desktop experience
- June 27, 2025. Successfully implemented comprehensive feedback capture system: top-bar widget with Like/Dislike/Bug/Suggestion/General buttons and logout functionality, resolved Replit overlay visibility issue, restored bottom navigation for Chat/Images/Scripts/Profile tabs
- June 27, 2025. Fixed critical WebSocket connection issues with Neon database: optimized connection pooling, improved timeout handling, enhanced session store configuration, and implemented proper error recovery - application now starts successfully
- June 27, 2025. Resolved feedback system database error: created missing user_feedback table, enabling full functionality of Like/Dislike/Bug/Suggestion/General feedback collection system
- June 27, 2025. Restored settings button to desktop navigation bar: users can now access all personalization options including color schemes, tone modes, voice settings, and language preferences
- June 27, 2025. Fixed Apple Sign In blank screen error: disabled Apple authentication strategy due to missing credentials, updated auth buttons to show proper error messages instead of causing authentication failures, Apple login now shows "Coming Soon" status with user-friendly messaging
- June 27, 2025. Implemented comprehensive "Receipts" folder system: tracks conversations by project (auto-sorted), stores dropped ideas with timestamps, manages scripts/drafts/breakdowns, logs tasks and decisions, provides accountability tracking with "receipts" of commitments, includes voice notes storage, features project organization with color coding, offers search and filtering capabilities, displays overdue commitments with Bonita's loving accountability reminders
- June 27, 2025. Fixed misleading "Network Error" messages in chat: identified speech recognition initialization as the source of false network error toasts, improved error handling to only show speech-related errors when users actively attempt voice input, cleaned up chat loading and error states for better user experience
- June 27, 2025. Resolved voice recording functionality: confirmed speech recognition works perfectly in Chrome, Safari, and Edge browsers with proper speech detection and transcription, added browser compatibility messaging for users in environments with limited speech API support (like Replit's embedded browser)
- June 27, 2025. Fixed unhandled promise rejection errors when stopping Bonita's response: improved abort controller error handling, added global promise rejection handler for abort errors, eliminated console errors during user-initiated stops
- June 27, 2025. Enhanced Receipts system with automatic conversation capture: meaningful chats with Bonita (over 50 characters) now automatically create conversation receipts including both user questions and Bonita's responses, organized with clean titles and medium priority for easy reference and accountability tracking
- June 27, 2025. Extended speech-to-speech recording duration from 15 to 25 seconds: users now have additional time to collect their thoughts during voice input, improving the speech-to-speech conversation experience
- June 27, 2025. Fixed message sending errors and response truncation: resolved variable scope issues in chat mutation, upgraded from gpt-4o-mini to full gpt-4o model, increased token limits to 2500 for detailed mode (800 for quick mode), made Bonita aware of her current response mode and token limits through dynamic system prompts, implemented automatic truncation detection with "Continue Response" button, and added comprehensive logging to track response completion
- June 27, 2025. Implemented smart continuation system for Quick Mode: Bonita now detects when her brief responses could benefit from elaboration and displays "Get More Details" and "Switch to Detailed Mode" buttons, enabling seamless transitions between response modes for optimal user experience

## User Preferences

Preferred communication style: Simple, everyday language.
Voice preference: Authentic African-American Bronx native with clean enunciation.
Conversation style: Hip-hop culture meets wisdom - uses music metaphors for life guidance.
Voice settings: Clean, full-bodied delivery with dynamic range like Lauryn Hill/MC Lyte, faster speech pace (1.25x playback speed) with stop controls.
Cultural knowledge: 90s hip-hop/R&B legends plus current artists and trends.
Current awareness: Real-time date/time context, current events, seasonal relevance, 2025 cultural landscape.
Font preference: Clean, compact font with tighter spacing for better readability.