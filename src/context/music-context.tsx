
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
  const [volume, setVolumeState] = useState(0.3); // User-facing volume
  
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentSong = playlist[currentSongIndex];

  useEffect(() => {
    if (audioElement && !fadeIntervalRef.current) {
      audioElement.volume = volume;
    }
  }, [volume, audioElement]);
  
  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  };

  const fadeIn = useCallback((audio: HTMLAudioElement, targetVolume: number) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    audio.volume = 0;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    
    let currentVol = 0;
    fadeIntervalRef.current = setInterval(() => {
        currentVol += 0.05;
        if (currentVol >= targetVolume) {
            audio.volume = targetVolume;
            if(fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        } else {
            audio.volume = currentVol;
        }
    }, 50);
  }, []);

  const fadeOut = useCallback((audio: HTMLAudioElement, onComplete: () => void) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    let currentVol = audio.volume;
    fadeIntervalRef.current = setInterval(() => {
        currentVol -= 0.05;
        if (currentVol <= 0) {
            audio.volume = 0;
            if(fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            onComplete();
        } else {
            audio.volume = currentVol;
        }
    }, 50);
  }, []);


  const togglePlayPause = useCallback(() => {
    if (!audioElement) return;

    if (isPlaying) {
      fadeOut(audioElement, () => {
        audioElement.pause();
        setIsPlaying(false);
      });
    } else {
      if (audioElement.src !== currentSong.url) {
        audioElement.src = currentSong.url;
      }
      fadeIn(audioElement, volume);
    }
  }, [audioElement, isPlaying, currentSong.url, fadeIn, fadeOut, volume]);


  const changeTrack = useCallback((newIndex: number) => {
    if (!audioElement) return;

    fadeOut(audioElement, () => {
        setCurrentSongIndex(newIndex);
        const newSong = playlist[newIndex];
        audioElement.src = newSong.url;
        fadeIn(audioElement, volume);
    });
  }, [audioElement, fadeOut, fadeIn, volume, playlist]);
  
  const playNext = useCallback(() => {
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    changeTrack(nextIndex);
  }, [currentSongIndex, playlist.length, changeTrack]);

  const playPrevious = useCallback(() => {
    const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    changeTrack(prevIndex);
  }, [currentSongIndex, playlist.length, changeTrack]);

  useEffect(() => {
    if (audioElement && isPlaying && audioElement.src !== currentSong.url) {
        audioElement.src = currentSong.url;
        fadeIn(audioElement, volume);
    }
}, [currentSong, audioElement, isPlaying, fadeIn, volume]);


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
