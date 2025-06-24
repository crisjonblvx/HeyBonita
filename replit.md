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

## User Preferences

Preferred communication style: Simple, everyday language.
Voice preference: Authentic African-American Bronx native with clean enunciation.
Conversation style: Hip-hop culture meets wisdom - uses music metaphors for life guidance.
Voice settings: Clean, full-bodied delivery with dynamic range like Lauryn Hill/MC Lyte, faster speech pace with stop controls.
Cultural knowledge: 90s hip-hop/R&B legends plus current artists and trends.
Current awareness: Real-time date/time context, current events, seasonal relevance, 2025 cultural landscape.
Font preference: Clean, compact font with tighter spacing for better readability.