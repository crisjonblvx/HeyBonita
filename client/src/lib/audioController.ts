// Global audio controller for managing speech playback
let currentAudio: HTMLAudioElement | null = null;

export function playAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopAudio(); // Stop any previous audio before starting new
    currentAudio = new Audio(url);
    
    currentAudio.onended = () => {
      currentAudio = null;
      resolve();
    };
    
    currentAudio.onerror = () => {
      currentAudio = null;
      reject(new Error('Audio playback failed'));
    };
    
    currentAudio.play().catch(reject);
  });
}

export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// Check if audio is currently playing
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

// Get current audio element for additional controls
export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
}