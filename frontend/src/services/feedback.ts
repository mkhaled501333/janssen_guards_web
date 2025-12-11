'use client';

import { toast } from 'sonner';
import { SOUND_FILES } from '@/constants';

class FeedbackService {
  private userInteracted = false;
  private successAudio: HTMLAudioElement | null = null;
  private errorAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for any user interaction to enable audio
      this.setupUserInteractionListener();
      // Preload audio files
      this.preloadAudio();
    }
  }

  private setupUserInteractionListener() {
    const enableAudio = () => {
      this.userInteracted = true;
    };

    // Use capture phase to catch interactions early
    document.addEventListener('click', enableAudio, { capture: true, once: true });
    document.addEventListener('touchstart', enableAudio, { capture: true, once: true });
    document.addEventListener('keydown', enableAudio, { capture: true, once: true });
  }

  private preloadAudio() {
    try {
      // Preload success sound
      this.successAudio = new Audio(SOUND_FILES.SUCCESS);
      this.successAudio.preload = 'auto';
      this.successAudio.volume = 0.7;
      
      // Preload error sound
      this.errorAudio = new Audio(SOUND_FILES.ERROR);
      this.errorAudio.preload = 'auto';
      this.errorAudio.volume = 0.7;
      
      // Load both audio files
      this.successAudio.load();
      this.errorAudio.load();
    } catch (err) {
      console.error('Failed to preload audio:', err);
    }
  }

  private async playAudio(audio: HTMLAudioElement | null, src: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Create a fresh audio element for each play to allow overlapping plays
      // and avoid issues with audio state
      const playAudio = new Audio(src);
      playAudio.volume = 0.7;
      playAudio.preload = 'auto';
      
      // Reset to beginning
      playAudio.currentTime = 0;
      
      // Try to play immediately, or wait for the audio to be ready
      const tryPlay = async () => {
        try {
          await playAudio.play();
        } catch (playErr: any) {
          // If not ready, wait a bit and try again
          if (playErr.name === 'NotAllowedError' && !this.userInteracted) {
            throw playErr;
          }
          // Wait for audio to be ready
          await new Promise<void>((resolve, reject) => {
            const handleCanPlay = () => {
              playAudio.removeEventListener('canplay', handleCanPlay);
              playAudio.removeEventListener('error', handleError);
              resolve();
            };
            
            const handleError = () => {
              playAudio.removeEventListener('canplay', handleCanPlay);
              playAudio.removeEventListener('error', handleError);
              reject(new Error('Audio failed to load'));
            };
            
            if (playAudio.readyState >= 2) {
              resolve();
            } else {
              playAudio.addEventListener('canplay', handleCanPlay, { once: true });
              playAudio.addEventListener('error', handleError, { once: true });
              playAudio.load();
              
              // Timeout after 1 second
              setTimeout(() => {
                if (playAudio.readyState < 2) {
                  playAudio.removeEventListener('canplay', handleCanPlay);
                  playAudio.removeEventListener('error', handleError);
                  reject(new Error('Audio load timeout'));
                }
              }, 1000);
            }
          });
          
          // Try playing again after it's ready
          await playAudio.play();
        }
      };
      
      await tryPlay();
      
      // Clean up after playback completes
      playAudio.addEventListener('ended', () => {
        playAudio.remove();
      }, { once: true });
      
      playAudio.addEventListener('error', () => {
        playAudio.remove();
      }, { once: true });
      
    } catch (err: any) {
      // Handle autoplay policy errors
      if (err.name === 'NotAllowedError') {
        if (!this.userInteracted) {
          console.warn('Audio requires user interaction. Please interact with the page first.');
        }
      } else if (err.name !== 'NotSupportedError' && err.name !== 'AbortError') {
        console.warn('Could not play audio:', err.message || err);
      }
    }
  }

  playSuccessSound() {
    if (!this.successAudio) {
      // If preload failed, try to create it now
      this.successAudio = new Audio(SOUND_FILES.SUCCESS);
      this.successAudio.volume = 0.7;
      this.successAudio.load();
    }
    this.playAudio(this.successAudio, SOUND_FILES.SUCCESS).catch(() => {
      // Error already logged in playAudio
    });
  }

  playErrorSound() {
    if (!this.errorAudio) {
      // If preload failed, try to create it now
      this.errorAudio = new Audio(SOUND_FILES.ERROR);
      this.errorAudio.volume = 0.7;
      this.errorAudio.load();
    }
    this.playAudio(this.errorAudio, SOUND_FILES.ERROR).catch(() => {
      // Error already logged in playAudio
    });
  }

  vibrate(pattern: number | number[] = 200) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  showSuccess(message: string, sound = true) {
    if (sound) {
      this.playSuccessSound();
      this.vibrate(200);
    }
    toast.success(message);
  }

  showError(message: string, sound = true) {
    if (sound) {
      this.playErrorSound();
      this.vibrate([100, 50, 100]);
    }
    toast.error(message);
  }

  showInfo(message: string) {
    toast.info(message);
  }

  showWarning(message: string) {
    toast.warning(message);
  }
}

export const feedbackService = new FeedbackService();

