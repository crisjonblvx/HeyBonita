import fetch from 'node-fetch';

export interface ElevenLabsConfig {
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

// Bonita's Voice Profile for ElevenLabs
// African-American woman from the Bronx with soulful, expressive voice
// Confident, witty, and nurturing - like your favorite auntie who tells it like it is
// Slightly raspy but warm, with playful inflection and strong emotional delivery

export const BONITA_VOICES = {
  'sweet-nurturing': {
    en: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - mature female voice with warmth
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4, // Lower for more expressive inflection
      similarityBoost: 0.9, // Higher for consistent Bronx character
      style: 0.7, // Higher for soulful, expressive delivery
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Same voice for consistency across languages
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.85,
      style: 0.65,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.85,
      style: 0.65,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.85,
      style: 0.65,
      useSpeakerBoost: true
    }
  },
  'tough-love': {
    en: {
      voiceId: 'ThT5KcBeYPX3keUQqHPh', // Dorothy - more assertive female voice
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3, // Even lower for more dynamic expression
      similarityBoost: 0.95, // Maximum for strong character consistency
      style: 0.8, // Maximum style for full attitude and inflection
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'ThT5KcBeYPX3keUQqHPh',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.35,
      similarityBoost: 0.9,
      style: 0.75,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'ThT5KcBeYPX3keUQqHPh',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.35,
      similarityBoost: 0.9,
      style: 0.75,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'ThT5KcBeYPX3keUQqHPh',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.35,
      similarityBoost: 0.9,
      style: 0.75,
      useSpeakerBoost: true
    }
  }
};

// Enhanced text preprocessing for Bonita's authentic voice
function preprocessTextForBonita(text: string, toneMode: 'sweet-nurturing' | 'tough-love'): string {
  let processedText = text;
  
  // Clean up any existing voice directions that might confuse the AI
  processedText = processedText.replace(/\*[^*]*\*/g, '');
  
  // Add natural pauses for more expressive delivery
  processedText = processedText.replace(/\.\.\./g, '...');
  
  // Add voice direction for authentic African-American female delivery
  if (toneMode === 'sweet-nurturing') {
    // Warm, nurturing auntie energy
    processedText = `[Voice: Warm, nurturing African-American woman from the Bronx, speaking with gentle confidence and maternal wisdom] ${processedText}`;
  } else {
    // Strong, assertive auntie energy
    processedText = `[Voice: Confident, no-nonsense African-American woman from the Bronx, speaking with authority and sass] ${processedText}`;
  }
  
  return processedText;
}

export async function generateSpeechWithElevenLabs(
  text: string,
  toneMode: 'sweet-nurturing' | 'tough-love',
  language: 'en' | 'es' | 'pt' | 'fr' = 'en'
): Promise<Buffer> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const config = BONITA_VOICES[toneMode][language];
  const processedText = preprocessTextForBonita(text, toneMode);
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: processedText,
      model_id: config.modelId,
      voice_settings: {
        stability: config.stability,
        similarity_boost: config.similarityBoost,
        style: config.style,
        use_speaker_boost: config.useSpeakerBoost,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText);
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getAvailableVoices(): Promise<any[]> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.voices;
}