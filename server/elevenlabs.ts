import fetch from 'node-fetch';

export interface ElevenLabsConfig {
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

// Voice configurations for different personality modes and languages
export const BONITA_VOICES = {
  'sweet-nurturing': {
    en: {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm, friendly
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0.3,
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - multilingual capable
      modelId: 'eleven_turbo_v2_5',
      stability: 0.6,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - multilingual
      modelId: 'eleven_turbo_v2_5',
      stability: 0.6,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - multilingual
      modelId: 'eleven_turbo_v2_5',
      stability: 0.6,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: true
    }
  },
  'tough-love': {
    en: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - more assertive
      modelId: 'eleven_turbo_v2_5',
      stability: 0.7,
      similarityBoost: 0.85,
      style: 0.6,
      useSpeakerBoost: true
    },
    es: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.7,
      similarityBoost: 0.85,
      style: 0.6,
      useSpeakerBoost: true
    },
    pt: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.7,
      similarityBoost: 0.85,
      style: 0.6,
      useSpeakerBoost: true
    },
    fr: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.7,
      similarityBoost: 0.85,
      style: 0.6,
      useSpeakerBoost: true
    }
  }
};

export async function generateSpeechWithElevenLabs(
  text: string,
  toneMode: 'sweet-nurturing' | 'tough-love',
  language: 'en' | 'es' | 'pt' | 'fr' = 'en'
): Promise<Buffer> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const config = BONITA_VOICES[toneMode][language];
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
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