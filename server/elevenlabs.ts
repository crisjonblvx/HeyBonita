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
      voiceId: 'XpYJVdFNVAV7rVr2CReC', // User's chosen voice - sweet and upbeat
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5, // Higher stability for cleaner sound, less distortion
      similarityBoost: 0.75, // Reduced to minimize bass/distortion
      style: 0.4, // Reduced for faster, cleaner delivery
      useSpeakerBoost: false // Disabled to reduce bass boost
    },
    es: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC', // Same voice for consistency
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: false
    },
    pt: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: false
    },
    fr: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: false
    }
  },
  'tough-love': {
    en: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC', // Same voice, adjusted settings for more assertive tone
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4, // Higher for cleaner, faster delivery
      similarityBoost: 0.7, // Reduced to minimize distortion
      style: 0.5, // Moderate for clear, assertive speech
      useSpeakerBoost: false // Disabled to reduce bass
    },
    es: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.7,
      style: 0.5,
      useSpeakerBoost: false
    },
    pt: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.7,
      style: 0.5,
      useSpeakerBoost: false
    },
    fr: {
      voiceId: 'XpYJVdFNVAV7rVr2CReC',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.7,
      style: 0.5,
      useSpeakerBoost: false
    }
  }
};

// Enhanced text preprocessing for Bonita's authentic voice
function preprocessTextForBonita(text: string, toneMode: 'sweet-nurturing' | 'tough-love'): string {
  let processedText = text;
  
  // Clean up any existing voice directions that might confuse the AI
  processedText = processedText.replace(/\*[^*]*\*/g, '');
  processedText = processedText.replace(/\[[^\]]*\]/g, '');
  
  // Add natural pauses for more expressive delivery
  processedText = processedText.replace(/\.\.\./g, '...');
  
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