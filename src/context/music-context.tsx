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
  const [playlist] = useState<Song[]>(songs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(0.3); // Default volume

  const currentSong = playlist[currentSongIndex];

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume;
    }
  }, [volume, audioElement]);
  
  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  };

  const togglePlayPause = useCallback(() => {
    if (!audioElement) return;

    if (audioElement.src && !audioElement.paused) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
       if (audioElement.src !== currentSong.url) {
        audioElement.src = currentSong.url;
      }
      audioElement.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [audioElement, currentSong]);

  const playNext = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  }, [playlist.length]);

  const playPrevious = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  useEffect(() => {
    const audio = audioElement;
    if (audio && currentSong) {
      audio.src = currentSong.url;
      if (isPlaying) {
        audio.play().catch(() => {
          // Autoplay might be blocked by the browser.
          setIsPlaying(false);
        });
      }
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
