// Client-side analytics tracking
let sessionId: string | null = null;
let sessionStart: number = Date.now();

// Generate or get session ID
function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
}

// Track analytics event
export async function trackEvent(eventType: string, eventData?: any, userId?: number) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId || null,
        sessionId: getSessionId(),
        eventType,
        eventData: eventData ? JSON.stringify(eventData) : null,
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Track page view
export function trackPageView(page: string, userId?: number) {
  trackEvent('page_view', { page }, userId);
}

// Track user action
export function trackAction(action: string, data?: any, userId?: number) {
  trackEvent('user_action', { action, ...data }, userId);
}

// Track chat message
export function trackChatMessage(userId: number, messageLength: number, language: string, toneMode: string) {
  trackEvent('chat_sent', {
    messageLength,
    language,
    toneMode,
    sessionDuration: Date.now() - sessionStart
  }, userId);
}

// Track image generation
export function trackImageGeneration(userId: number, prompt: string, language: string) {
  trackEvent('image_generated', {
    promptLength: prompt.length,
    language,
    sessionDuration: Date.now() - sessionStart
  }, userId);
}

// Track script creation
export function trackScriptCreation(userId: number, topic: string, platform: string, language: string) {
  trackEvent('script_created', {
    topicLength: topic.length,
    platform,
    language,
    sessionDuration: Date.now() - sessionStart
  }, userId);
}

// Track user signup/login
export function trackUserSignup(userId: number) {
  trackEvent('signup', { signupTime: new Date().toISOString() }, userId);
}

export function trackUserLogin(userId: number) {
  trackEvent('login', { loginTime: new Date().toISOString() }, userId);
}