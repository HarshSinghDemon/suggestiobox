
'use client';

import { songs } from '@/lib/songs';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';

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
  const [playlist] = useState<Song[]>(songs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(0.3);
  
  const currentSong = playlist[currentSongIndex];

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioElement) {
      audioElement.volume = clampedVolume;
    }
  };

  const togglePlayPause = useCallback(() => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      if (audioElement.src !== currentSong.url) {
        audioElement.src = currentSong.url;
      }
      audioElement.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [audioElement, isPlaying, currentSong.url]);

  const changeTrack = useCallback((newIndex: number) => {
    setCurrentSongIndex(newIndex);
    if (audioElement) {
        const newSong = playlist[newIndex];
        audioElement.src = newSong.url;
        if (isPlaying) {
            audioElement.play().catch(() => setIsPlaying(false));
        }
    }
  }, [audioElement, isPlaying, playlist]);
  
  const playNext = useCallback(() => {
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    changeTrack(nextIndex);
  }, [currentSongIndex, playlist.length, changeTrack]);

  const playPrevious = useCallback(() => {
    const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    changeTrack(prevIndex);
  }, [currentSongIndex, playlist.length, changeTrack]);

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume;
    }
  }, [audioElement, volume]);

  useEffect(() => {
    if (audioElement && isPlaying && audioElement.src !== currentSong.url) {
        audioElement.src = currentSong.url;
        audioElement.play().catch(() => setIsPlaying(false));
    }
  }, [currentSong, audioElement, isPlaying]);


  const value: MusicContextType = {
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
