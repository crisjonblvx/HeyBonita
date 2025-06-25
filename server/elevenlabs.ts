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
// African-American Bronx native with clean enunciation and soulful confidence
// Clear, full-bodied voice with subtle rasp like Lauryn Hill meets MC Lyte
// Strong dynamic range - can drop wisdom soft or come in high like a hype track
// Rhythm in her words like she grew up speaking over boom bap beats

export const BONITA_VOICES = {
  'sweet-nurturing': {
    en: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd', // New voice selection - clean, soulful
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4, // Lower for faster, more dynamic speech
      similarityBoost: 0.75, // Balanced for clear, faster delivery
      style: 0.2, // Lower for quicker, natural flow
      useSpeakerBoost: false // Clean sound, no bass boost
    },
    es: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd', // Same voice for consistency
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.7,
      style: 0.25,
      useSpeakerBoost: false
    },
    pt: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.7,
      style: 0.25,
      useSpeakerBoost: false
    },
    fr: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.4,
      similarityBoost: 0.7,
      style: 0.25,
      useSpeakerBoost: false
    }
  },
  'tough-love': {
    en: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd', // Same voice, MC Lyte confidence
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3, // Lower for faster, more assertive delivery
      similarityBoost: 0.8, // Balanced for strong but fast delivery
      style: 0.3, // Lower for quicker, confident speech
      useSpeakerBoost: false // Clean, powerful delivery
    },
    es: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3,
      similarityBoost: 0.75,
      style: 0.35,
      useSpeakerBoost: false
    },
    pt: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3,
      similarityBoost: 0.75,
      style: 0.35,
      useSpeakerBoost: false
    },
    fr: {
      voiceId: 'aTxZrSrp47xsP6Ot4Kgd',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.3,
      similarityBoost: 0.75,
      style: 0.35,
      useSpeakerBoost: false
    }
  }
};

// Enhanced text preprocessing for Bonita's authentic voice
// Speech personality enhancements for authentic Bonita delivery
const slangCorrections = {
  // Pronunciation corrections for ElevenLabs
  "Chile": "Childe", // pronounced like 'child' with soft d
  "2025": "Twenty Twenty-five",
  "2024": "Twenty Twenty-four",
  
  // Common Black vernacular enhancements
  "nah": "nah", // preserve with tone
  "no": "nah",
  "finna": "fixin' to",
  "gon": "gonna",
  "on God": "on everything, baby",
  "fr": "for real",
  "bet": "say less",
  "sus": "shady",
  "lit": "poppin'",
  "cap": "lie",
  "no cap": "dead serious",
  "vibe": "energy",
  
  // Style corrections for speech flow
  "okay": "aight",
  "hello": "hey boo",
  "goodbye": "alright now, take care sugar",
  "thanks": "preciate you",
  "thank you": "preciate you",
  "you know": "you feel me",
  "understand": "get it",
  "really": "real talk",
  "seriously": "dead serious"
};

function applySlangCorrections(text: string): string {
  let corrected = text;
  for (const [term, replacement] of Object.entries(slangCorrections)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    corrected = corrected.replace(regex, replacement);
  }
  return corrected;
}

function preprocessTextForBonita(text: string, toneMode: 'sweet-nurturing' | 'tough-love'): string {
  let processedText = text;
  
  // Apply authentic speech corrections first
  processedText = applySlangCorrections(processedText);
  
  // Clean up any existing voice directions that might confuse the AI
  processedText = processedText.replace(/\*[^*]*\*/g, '');
  processedText = processedText.replace(/\[[^\]]*\]/g, '');
  
  // Add natural pauses for more expressive delivery
  processedText = processedText.replace(/\.\.\./g, '...');
  
  // Add tone-specific speech enhancements
  if (toneMode === 'tough-love') {
    // Add emphasis for tough love delivery
    processedText = processedText.replace(/\breal talk\b/gi, 'REAL talk');
    processedText = processedText.replace(/\blisten\b/gi, 'Listen up');
  } else {
    // Sweet nurturing tone enhancements
    processedText = processedText.replace(/\bbaby\b/gi, 'baby');
    processedText = processedText.replace(/\bhoney\b/gi, 'honey');
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