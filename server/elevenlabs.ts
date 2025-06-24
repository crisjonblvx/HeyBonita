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
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - deeper, warmer tone for nurturing
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4, // Lower for more expressive inflection
      similarityBoost: 0.9, // Higher for consistent Bronx character
      style: 0.7, // Higher for soulful, expressive delivery
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Same voice for consistency across languages
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.85,
      style: 0.65,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.85,
      style: 0.65,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.85,
      style: 0.65,
      useSpeakerBoost: true
    }
  },
  'tough-love': {
    en: {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Same voice, different settings for attitude
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3, // Even lower for more dynamic expression
      similarityBoost: 0.95, // Maximum for strong character consistency
      style: 0.8, // Maximum style for full attitude and inflection
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.35,
      similarityBoost: 0.9,
      style: 0.75,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.35,
      similarityBoost: 0.9,
      style: 0.75,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
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
  
  // Add natural pauses and emphasis for Bonita's speaking style
  processedText = processedText.replace(/\./g, '...');
  processedText = processedText.replace(/!/g, '!');
  processedText = processedText.replace(/\?/g, '?');
  
  // Add subtle voice direction for more authentic delivery
  if (toneMode === 'sweet-nurturing') {
    // Softer, more nurturing delivery cues
    processedText = `*speaking with warmth and gentle wisdom* ${processedText}`;
  } else {
    // More direct, assertive delivery cues  
    processedText = `*speaking with confident, no-nonsense Bronx attitude* ${processedText}`;
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