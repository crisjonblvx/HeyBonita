import { db } from './db';
import { scriptTemplates, videoScripts, users } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Advanced script templates for different platforms
const ENHANCED_SCRIPT_TEMPLATES = [
  // TikTok Templates
  {
    name: "TikTok Hook Formula",
    description: "Attention-grabbing opening for viral TikTok content",
    platform: "tiktok",
    duration: "15-30s",
    category: "educational",
    template: `Hook (First 3 seconds):
"POV: You're about to learn [TOPIC] in 30 seconds"
OR
"Stop scrolling if you want to [BENEFIT]"

Body (25 seconds):
- Point 1: [Quick tip/fact]
- Point 2: [Supporting detail]
- Point 3: [Action step]

CTA:
"Follow for more [TOPIC] tips!"
"Save this if it helped!"

Hashtags: #[MAINTOPIC] #fyp #viral #[NICHE]`
  },
  {
    name: "TikTok Trending Audio Adaptation",
    description: "Structure for trending audio content",
    platform: "tiktok",
    duration: "15-30s",
    category: "entertainment",
    template: `Audio Sync Points:
Beat 1: [Opening visual/text]
Beat 2: [Transition/reveal]
Beat 3: [Main content]
Beat 4: [Punchline/conclusion]

Visual Elements:
- Text overlay: [Key message]
- Props/setup: [What you need]
- Facial expressions: [Match audio mood]

Trending hashtags: #[AUDIONAME] #trend #viral`
  },

  // Instagram Templates
  {
    name: "Instagram Reel Educational",
    description: "Multi-part educational content for Reels",
    platform: "instagram",
    duration: "30-60s",
    category: "educational",
    template: `Hook (0-3s): "Here's what nobody tells you about [TOPIC]"

Section 1 (3-15s): The Problem
"Most people think [COMMON BELIEF]"
"But here's the truth..."

Section 2 (15-40s): The Solution
"Step 1: [ACTION]"
"Step 2: [ACTION]"
"Step 3: [ACTION]"

Section 3 (40-60s): The Result
"When you do this, you'll [BENEFIT]"
"Try it and let me know in the comments!"

CTA: "Save this post" + "Follow for more [TOPIC] content"`
  },
  {
    name: "Instagram Story Series",
    description: "Multi-story educational series",
    platform: "instagram",
    duration: "multiple",
    category: "educational",
    template: `Story 1: Hook
"I'm about to teach you [TOPIC] in 5 stories"
[Poll: "Ready to learn?"]

Story 2-4: Content
Story 2: "First, [POINT 1]"
Story 3: "Next, [POINT 2]"
Story 4: "Finally, [POINT 3]"

Story 5: Recap + CTA
"Recap: [QUICK SUMMARY]"
"Swipe up to see my latest post about this"
[Question sticker: "What's your biggest challenge with [TOPIC]?"]`
  },

  // YouTube Templates
  {
    name: "YouTube Long-form Educational",
    description: "In-depth tutorial structure",
    platform: "youtube",
    duration: "8-15min",
    category: "educational",
    template: `Intro (0-30s):
"In this video, I'm going to show you [MAIN PROMISE]"
"By the end, you'll be able to [SPECIFIC OUTCOME]"
"Let's jump right in"

Problem Setup (30s-2min):
"Here's the challenge most people face..."
"Maybe you've experienced this too..."
"The good news is, there's a better way"

Solution Overview (2-3min):
"Here's exactly what we're going to cover:"
"1. [SECTION 1]"
"2. [SECTION 2]"
"3. [SECTION 3]"

Main Content (3-12min):
[Detailed explanation with examples]
[Visual aids/screen shares]
[Real-world applications]

Conclusion (12-15min):
"Let's recap what we covered..."
"Your next step is to [ACTION]"
"If this helped, please like and subscribe"
"What questions do you have? Leave them below"`
  },
  {
    name: "YouTube Shorts Viral Formula",
    description: "90-second viral content structure",
    platform: "youtube",
    duration: "60-90s",
    category: "entertainment",
    template: `Hook (0-3s): "This will blow your mind"

Setup (3-15s):
"You know how [COMMON SITUATION]?"
"Well, here's something crazy..."

Payoff (15-75s):
[Deliver the main content/revelation]
[Use visual elements]
[Build suspense]

CTA (75-90s):
"If this amazed you, smash that subscribe button"
"And check out this related video"`
  },

  // LinkedIn Templates
  {
    name: "LinkedIn Professional Insight",
    description: "Thought leadership content for professionals",
    platform: "linkedin",
    duration: "60-90s",
    category: "business",
    template: `Hook: "After 10 years in [INDUSTRY], here's what I've learned about [TOPIC]"

Personal Story (15s):
"Early in my career, I thought [MISCONCEPTION]"
"But then I discovered..."

Key Insight (30s):
"The truth is: [MAIN INSIGHT]"
"Here's why this matters:"

Practical Application (30s):
"You can apply this by:"
"1. [ACTIONABLE STEP]"
"2. [ACTIONABLE STEP]"
"3. [ACTIONABLE STEP]"

CTA: "What's been your experience with [TOPIC]? Share in the comments"`
  },

  // Podcast Templates
  {
    name: "Podcast Episode Intro",
    description: "Engaging podcast episode opening",
    platform: "podcast",
    duration: "2-3min",
    category: "business",
    template: `Cold Open (30s):
[Compelling quote or moment from the episode]
"That's [GUEST NAME], and you're about to hear why [TEASER]"

Show Intro (30s):
"Welcome to [SHOW NAME], the podcast where [SHOW MISSION]"
"I'm your host [NAME]"

Episode Setup (60s):
"Today we're talking about [TOPIC]"
"This is important because [WHY IT MATTERS]"
"We'll cover [3 KEY POINTS]"

Guest Introduction (30s):
"My guest today is [NAME], who [CREDENTIALS/ACHIEVEMENTS]"
"[PERSONAL CONNECTION/WHY THIS GUEST]"`
  }
];

// Initialize enhanced script templates
export async function initializeEnhancedTemplates(): Promise<void> {
  try {
    for (const template of ENHANCED_SCRIPT_TEMPLATES) {
      await db
        .insert(scriptTemplates)
        .values(template)
        .onConflictDoNothing();
    }
    console.log('Enhanced script templates initialized');
  } catch (error) {
    console.error('Error initializing enhanced templates:', error);
  }
}

// Get templates by platform and category
export async function getScriptTemplatesByPlatform(
  platform: string,
  category?: string
): Promise<any[]> {
  try {
    let query = db
      .select()
      .from(scriptTemplates)
      .where(and(
        eq(scriptTemplates.platform, platform),
        eq(scriptTemplates.isActive, true)
      ));

    if (category) {
      query = query.where(eq(scriptTemplates.category, category));
    }

    return await query.orderBy(scriptTemplates.name);
  } catch (error) {
    console.error('Error getting script templates:', error);
    return [];
  }
}

// Generate script with trending hashtags
export async function generateScriptWithTrends(
  userId: number,
  templateId: number,
  topic: string,
  customization: {
    tone?: 'professional' | 'casual' | 'energetic' | 'educational';
    targetAudience?: string;
    callToAction?: string;
    includeTrending?: boolean;
  }
): Promise<{ script: string; hashtags: string[]; tips: string[] }> {
  try {
    // Get the template
    const [template] = await db
      .select()
      .from(scriptTemplates)
      .where(eq(scriptTemplates.id, templateId));

    if (!template) {
      throw new Error('Template not found');
    }

    // Customize the script based on platform and preferences
    let customizedScript = template.template;
    
    // Replace placeholders with actual content
    customizedScript = customizedScript
      .replace(/\[TOPIC\]/g, topic)
      .replace(/\[MAINTOPIC\]/g, topic.toLowerCase().replace(/\s+/g, ''))
      .replace(/\[NICHE\]/g, customization.targetAudience || 'tips');

    // Generate platform-specific hashtags
    const hashtags = generateHashtagsForPlatform(template.platform, topic, customization.includeTrending);

    // Generate optimization tips
    const tips = generateOptimizationTips(template.platform, template.duration);

    // Save the generated script
    await db.insert(videoScripts).values({
      userId,
      topic,
      platform: template.platform,
      duration: template.duration,
      script: customizedScript,
      language: 'en'
    });

    return {
      script: customizedScript,
      hashtags,
      tips
    };
  } catch (error) {
    console.error('Error generating script with trends:', error);
    throw error;
  }
}

// Generate platform-specific hashtags
function generateHashtagsForPlatform(
  platform: string,
  topic: string,
  includeTrending: boolean = true
): string[] {
  const baseHashtags = [topic.toLowerCase().replace(/\s+/g, '')];
  
  const platformHashtags = {
    tiktok: ['fyp', 'viral', 'trending', 'foryou', 'tiktoktips'],
    instagram: ['reels', 'explore', 'viral', 'trending', 'instagood'],
    youtube: ['shorts', 'viral', 'trending', 'youtube', 'subscribe'],
    linkedin: ['professional', 'business', 'career', 'networking', 'leadership'],
    podcast: ['podcast', 'interview', 'insights', 'business', 'entrepreneur']
  };

  const trendingHashtags = {
    tiktok: ['mindset2025', 'productivity', 'selfcare', 'growth'],
    instagram: ['motivation', 'inspiration', 'lifestyle', 'success'],
    youtube: ['education', 'tutorial', 'howto', 'learn'],
    linkedin: ['innovation', 'digitalmarketing', 'ai', 'future'],
    podcast: ['thoughtleadership', 'expertise', 'industry', 'vision']
  };

  let hashtags = [...baseHashtags, ...platformHashtags[platform] || []];
  
  if (includeTrending) {
    hashtags = [...hashtags, ...trendingHashtags[platform] || []];
  }

  return hashtags.slice(0, 10); // Limit to 10 hashtags
}

// Generate platform-specific optimization tips
function generateOptimizationTips(platform: string, duration: string): string[] {
  const tips = {
    tiktok: [
      "Hook viewers in the first 3 seconds",
      "Use trending sounds and effects",
      "Post during peak hours (6-10 PM)",
      "Engage with comments within the first hour",
      "Use captions for accessibility"
    ],
    instagram: [
      "Use high-quality visuals",
      "Post consistently at optimal times",
      "Engage with your audience in comments",
      "Use relevant hashtags (mix popular and niche)",
      "Create shareable content"
    ],
    youtube: [
      "Create compelling thumbnails",
      "Optimize your title for search",
      "Use cards and end screens",
      "Engage with comments early",
      "Include keywords in description"
    ],
    linkedin: [
      "Post during business hours",
      "Use professional language",
      "Include industry-relevant keywords",
      "Engage with professional networks",
      "Share valuable insights"
    ],
    podcast: [
      "Start with a compelling hook",
      "Keep intro under 2 minutes",
      "Use clear audio quality",
      "Include show notes",
      "Promote across social platforms"
    ]
  };

  return tips[platform] || [
    "Know your audience",
    "Create valuable content",
    "Be consistent",
    "Engage authentically",
    "Analyze your metrics"
  ];
}