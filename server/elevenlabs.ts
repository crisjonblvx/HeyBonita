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
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - natural female voice
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3, // Lower for more dynamic expression
      similarityBoost: 0.85, // Balanced for natural delivery
      style: 0.6, // Moderate style for authentic feel
      useSpeakerBoost: true
    },
    es: {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Same voice for consistency
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.8,
      style: 0.55,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.8,
      style: 0.55,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.8,
      style: 0.55,
      useSpeakerBoost: true
    }
  },
  'tough-love': {
    en: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - more assertive delivery
      modelId: 'eleven_turbo_v2_5',
      stability: 0.2, // Very low for maximum dynamic expression
      similarityBoost: 0.9, // High for character consistency
      style: 0.75, // High style for attitude and inflection
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.25,
      similarityBoost: 0.85,
      style: 0.7,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.25,
      similarityBoost: 0.85,
      style: 0.7,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.25,
      similarityBoost: 0.85,
      style: 0.7,
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
    // Warm but real auntie energy
    processedText = `[Voice: Warm but direct African-American woman from the Bronx, speaking with authentic caring and natural rhythm] ${processedText}`;
  } else {
    // Strong, challenging auntie energy
    processedText = `[Voice: Confident, challenging African-American woman from the Bronx, speaking with authority and realness] ${processedText}`;
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