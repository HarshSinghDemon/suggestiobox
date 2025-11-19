'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  fadeAudio: (targetVolume: number, duration?: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay on load
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fadeAudio = useCallback((targetVolume: number, duration: number = 1000) => {
    const audio = (fadeAudio as any).audio;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    if (targetVolume > 0 && audio.paused) {
      audio.volume = 0;
      audio.play().catch(() => {
        // Autoplay was prevented
        setIsPlaying(false);
      });
    }

    const startVolume = audio.volume;
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;

    if (volumeStep === 0) {
        if(targetVolume === 0) {
            audio.pause();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
        }
        return;
    };

    fadeIntervalRef.current = setInterval(() => {
      const newVolume = audio.volume + volumeStep;
      if ((volumeStep > 0 && newVolume >= targetVolume) || (volumeStep < 0 && newVolume <= targetVolume)) {
        audio.volume = targetVolume;
        if (targetVolume === 0) {
          audio.pause();
          setIsPlaying(false);
        } else {
          setIsPlaying(true);
        }
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
      } else {
        audio.volume = newVolume;
      }
    }, stepDuration);
  }, []);
  
  const toggleMusic = useCallback(() => {
    if (isPlaying) {
      fadeAudio(0);
    } else {
      fadeAudio(0.2);
    }
  }, [isPlaying, fadeAudio]);

  const value = { isPlaying, toggleMusic, fadeAudio };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}
