'use client';

import { songs } from '@/lib/songs';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Song = {
  title: string;
  artist: string;
  url: string;
};

interface MusicContextType {
  isPlaying: boolean;
  currentSong: Song;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const currentSong = songs[currentSongIndex];

  const fade = useCallback((audio: HTMLAudioElement, direction: 'in' | 'out', callback?: () => void) => {
    let volume = direction === 'in' ? 0 : 0.3;
    audio.volume = volume;
    if (direction === 'in' && audio.paused) {
      audio.play().catch(() => {});
    }

    const interval = setInterval(() => {
      volume += direction === 'in' ? 0.05 : -0.05;
      if (volume >= 0 && volume <= 0.3) {
        audio.volume = Math.max(0, Math.min(0.3, volume));
      } else {
        clearInterval(interval);
        if (direction === 'out') {
          audio.pause();
        }
        if (callback) callback();
      }
    }, 50);
  }, []);

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
    togglePlayPause,
    playNext,
    playPrevious,
    setAudioElement,
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
