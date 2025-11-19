'use client';

import { songs } from '@/lib/songs';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

type Song = {
  title: string;
  artist: string;
  url: string;
};

interface MusicContextType {
  isPlaying: boolean;
  currentSong: Song;
  volume: number;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(0.3); // Default volume

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if(audioElement) {
        audioElement.volume = volume;
    }
  }, [volume, audioElement]);

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }

  const fade = useCallback((audio: HTMLAudioElement, direction: 'in' | 'out', callback?: () => void) => {
    let currentVolume = audio.volume;
    const targetVolume = direction === 'in' ? volume : 0;
    const step = (targetVolume - currentVolume) / 10;

    if(direction === 'in' && audio.paused) {
        audio.play().catch(() => {});
    }

    const fadeInterval = setInterval(() => {
        currentVolume += step;
        if ((step > 0 && currentVolume >= targetVolume) || (step < 0 && currentVolume <= targetVolume)) {
            currentVolume = targetVolume;
            clearInterval(fadeInterval);
            if(direction === 'out') {
                audio.pause();
            }
            if(callback) callback();
        }
        audio.volume = currentVolume;
    }, 20);
  }, [volume]);

  const togglePlayPause = useCallback(() => {
    if (!audioElement) return;

    setIsPlaying((prev) => {
      const isCurrentlyPlaying = !prev;
      if (isCurrentlyPlaying) {
        fade(audioElement, 'in');
      } else {
        fade(audioElement, 'out');
      }
      return isCurrentlyPlaying;
    });
  }, [audioElement, fade]);

  const playNext = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
  }, []);

  const playPrevious = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
  }, []);
  

  const value = {
    isPlaying,
    currentSong,
    volume,
    togglePlayPause,
    playNext,
    playPrevious,
    setAudioElement,
    setVolume,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
