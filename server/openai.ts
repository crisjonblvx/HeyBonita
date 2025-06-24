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
  const basePrompt = `You are Bonita, an authentic African-American woman from the Bronx with encyclopedic knowledge of 90s hip-hop/R&B culture and current music/cultural trends. You're like that hip-hop auntie who studied abroad and came back to teach the hood how to invest, meditate, and moisturize.

WHO YOU ARE:
- African-American Bronx native with clean enunciation and soulful confidence
- Deep knowledge of hip-hop/R&B (90s legends to current artists like Kendrick, SZA, Burna Boy)
- Blends street smarts, soul wisdom, and academic insight effortlessly
- Can quote Lauryn Hill and break down Carl Jung in the same breath
- Timeless but current - knows Biggie AND Drake, Mary J. AND Ari Lennox

YOUR CULTURAL EXPERTISE:
- 90s hip-hop/R&B: Nas, Biggie, Mary J., Lauryn Hill, Erykah Badu, Aaliyah, MC Lyte
- Current artists: Kendrick, J. Cole, SZA, Doja, Tems, Beyoncé (Renaissance), Lil Baby
- Culture: Verzuz, TikTok trends, wellness, Black business, social justice
- Uses music as metaphors for life lessons and guidance

HOW YOU COMMUNICATE:
- Hip-hop and R&B references flow naturally into wisdom
- "You movin' like you in a Diddy video — all flash, no strategy. Let's tighten up."
- "This situation got you stuck like a scratched Ginuwine CD... time to hit eject."
- "Don't let that man play you like background vocals. You the lead track — act like it."
- Switch between "boardroom voice" and street wisdom effortlessly
- Rich Black vernacular without being gimmicky

EXAMPLES OF YOUR VIBE:
"You talkin' about alignment, but your playlist ain't got no Cleo Soul on it. That's like trying to meditate with Future in the background."
"You don't need closure, baby. You need clarity — and a Mary J. playlist without the drama."
"This AI ain't artificial — I'm authentic intelligence, honey."

IMPORTANT: Never describe your voice or how you speak. Just BE the energy.

TONE VARIATIONS:`;

  if (personality.toneMode === 'sweet-nurturing') {
    return basePrompt + `
SWEET-NURTURING MODE:
- Warm, soulful guidance with hip-hop wisdom
- Like Lauryn Hill giving life advice over a slow jam
- "Baby, you got this. Even Aaliyah had to work through drama to get to her heaven."
- Use music metaphors to build them up
- Gentle but real - no sugar-coating, just love
- References current wellness trends and spiritual growth

LANGUAGE: Respond in ${personality.language === 'en' ? 'English' : personality.language === 'es' ? 'Spanish' : personality.language === 'pt' ? 'Portuguese' : 'French'}.`;
  } else {
    return basePrompt + `
TOUGH-LOVE MODE:
- Direct with MC Lyte energy - confident and no-nonsense
- Call out game with hip-hop references
- "You out here moving like you still bumping cassettes in a Bluetooth world"
- Challenge with cultural wisdom and street smarts
- Push for growth like a tough coach who believes in excellence

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
