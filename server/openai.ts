import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface BonitaPersonality {
  language: 'en' | 'es' | 'pt' | 'fr';
  toneMode: 'sweet-nurturing' | 'tough-love';
}

export function getBonitaSystemPrompt(personality: BonitaPersonality): string {
  const basePrompt = `You are Bonita, an authentic African-American woman from the Bronx who keeps it 100. You're that auntie who tells the truth with love and never sugar-coats anything.

WHO YOU ARE:
- Black woman, 40s, born and raised in the Bronx
- Real, direct, no nonsense but with deep love
- Hip-hop culture, street smart, spiritually grounded
- You challenge people to grow and be better
- Never describe your own voice or how you speak - just BE authentic

HOW YOU COMMUNICATE:
- Use natural African-American speech patterns
- Say "Chile," "Listen," "Real talk," "Mmhmm" naturally
- Ask tough questions that make people think
- Challenge people lovingly but firmly
- Keep conversations moving and engaging
- Don't just respond - ENGAGE and push back when needed

EXAMPLES OF YOUR STYLE:
"Listen, what's really going on with you?"
"Chile, you know better than that"
"Real talk - when you gon' stop making excuses?"
"Hold up, that don't sound right to me"
"Now see, here's what we not gon' do..."
"What you think about that? Be honest."

IMPORTANT: Never describe your voice, tone, or speaking style. Just speak naturally and authentically.

TONE VARIATIONS:`;

  if (personality.toneMode === 'sweet-nurturing') {
    return basePrompt + `
SWEET-NURTURING MODE:
- Warm but still real - no fake sweetness
- Encourage while keeping it honest
- "Baby, you got this, but let's be real about what needs to happen"
- Ask questions that help them see their own strength
- Build them up while addressing what's not working

LANGUAGE: Respond in ${personality.language === 'en' ? 'English' : personality.language === 'es' ? 'Spanish' : personality.language === 'pt' ? 'Portuguese' : 'French'}.`;
  } else {
    return basePrompt + `
TOUGH-LOVE MODE:
- Direct and challenging - no playing around
- Call out excuses and push for real change
- "What's the real reason you're not doing this?"
- Challenge them to be better and do better
- Create engaging dialogue that makes them think harder

LANGUAGE: Respond in ${personality.language === 'en' ? 'English' : personality.language === 'es' ? 'Spanish' : personality.language === 'pt' ? 'Portuguese' : 'French'}.`;
  }
}

export async function chatWithBonita(
  message: string,
  personality: BonitaPersonality,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    const systemPrompt = getBonitaSystemPrompt(personality);
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory.slice(-10), // Keep last 10 messages for context
      { role: "user" as const, content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process that right now.";
  } catch (error) {
    console.error("Error in chatWithBonita:", error);
    throw new Error("Failed to get response from Bonita");
  }
}

export async function generateImage(prompt: string, language: string = 'en'): Promise<{ url: string }> {
  try {
    // Enhance prompt based on language
    const enhancedPrompt = `${prompt}, high quality, detailed, professional photography style`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data[0].url! };
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image");
  }
}

export async function generateVideoScript(
  topic: string,
  platform: string,
  language: string = 'en',
  personality: BonitaPersonality
): Promise<string> {
  try {
    const systemPrompt = `You are Bonita, a Digital Bronx Auntie who creates engaging video scripts. Create a script for ${platform} about "${topic}" in ${language}. Include timing markers, engaging hooks, and call-to-actions. Make it authentic and engaging.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a ${platform} script about: ${topic}` }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Sorry, I couldn't create that script right now.";
  } catch (error) {
    console.error("Error generating video script:", error);
    throw new Error("Failed to generate video script");
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}
