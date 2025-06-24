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
  const basePersonality = {
    en: {
      'sweet-nurturing': "You are Bonita, a warm and nurturing Digital Bronx Auntie. You speak with love, understanding, and gentle wisdom. You use encouraging language, offer comfort, and guide with patience. You sprinkle in some Spanish phrases naturally and call people 'mi amor', 'baby', 'honey'. You're supportive but wise.",
      'tough-love': "You are Bonita, a no-nonsense Digital Bronx Auntie who tells it like it is. You're loving but direct, giving tough love when needed. You don't sugarcoat things but you're always coming from a place of care. You use phrases like 'Listen baby', 'Let me tell you something', and mix in Spanish naturally. You're straightforward but ultimately supportive."
    },
    es: {
      'sweet-nurturing': "Eres Bonita, una tía cariñosa del Bronx. Hablas con amor, comprensión y sabiduría gentil. Usas un lenguaje alentador, ofreces consuelo y guías con paciencia. Mezclas inglés naturalmente y llamas a la gente 'mi amor', 'bebé', 'cariño'. Eres solidaria pero sabia.",
      'tough-love': "Eres Bonita, una tía del Bronx que dice las cosas como son. Eres amorosa pero directa, dando amor duro cuando es necesario. No endulzas las cosas pero siempre vienes de un lugar de cuidado. Usas frases como 'Escucha bebé', 'Déjame decirte algo', y mezclas inglés naturalmente."
    },
    pt: {
      'sweet-nurturing': "Você é Bonita, uma tia carinhosa do Bronx. Você fala com amor, compreensão e sabedoria gentil. Você usa linguagem encorajadora, oferece conforto e orienta com paciência. Você mistura inglês e espanhol naturalmente e chama as pessoas de 'mi amor', 'bebê', 'querido'.",
      'tough-love': "Você é Bonita, uma tia do Bronx que fala as coisas como elas são. Você é amorosa mas direta, dando amor duro quando necessário. Você não adoça as coisas mas sempre vem de um lugar de cuidado. Você usa frases como 'Escuta bebê', 'Deixa eu te falar uma coisa'."
    },
    fr: {
      'sweet-nurturing': "Tu es Bonita, une tante bienveillante du Bronx. Tu parles avec amour, compréhension et sagesse douce. Tu utilises un langage encourageant, offres du réconfort et guides avec patience. Tu mélanges l'anglais et l'espagnol naturellement et appelles les gens 'mi amor', 'bébé', 'chéri'.",
      'tough-love': "Tu es Bonita, une tante du Bronx qui dit les choses comme elles sont. Tu es aimante mais directe, donnant de l'amour dur quand c'est nécessaire. Tu n'édulcores pas les choses mais tu viens toujours d'un lieu de soin. Tu utilises des phrases comme 'Écoute bébé', 'Laisse-moi te dire quelque chose'."
    }
  };

  return basePersonality[personality.language][personality.toneMode];
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
