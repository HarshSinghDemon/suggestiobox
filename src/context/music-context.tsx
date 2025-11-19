
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

  const fadeVolume = useCallback((audio: HTMLAudioElement, targetVolume: number, duration: number = 300) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const startVolume = audio.volume;
    const difference = targetVolume - startVolume;
    if (difference === 0) return;

    const stepTime = 20; // ms
    const numberOfSteps = duration / stepTime;
    const volumeStep = difference / numberOfSteps;

    let currentStep = 0;
    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= numberOfSteps) {
        audio.volume = targetVolume;
        if(fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      } else {
        audio.volume += volumeStep;
      }
    }, stepTime);
  }, []);

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioElement) {
      fadeVolume(audioElement, clampedVolume);
    }
  };

  const fadeIn = useCallback((audio: HTMLAudioElement, targetVolume: number) => {
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    fadeVolume(audio, targetVolume, 500); // Slower fade-in
  }, [fadeVolume]);

  const fadeOut = useCallback((audio: HTMLAudioElement, onComplete: () => void) => {
    fadeVolume(audio, 0, 500); // Slower fade-out
    setTimeout(onComplete, 550); // Ensure fade completes before action
  }, [fadeVolume]);


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

    const playNewTrack = () => {
        setCurrentSongIndex(newIndex);
        const newSong = playlist[newIndex];
        audioElement.src = newSong.url;
        fadeIn(audioElement, volume);
    };

    if (isPlaying) {
        fadeOut(audioElement, playNewTrack);
    } else {
        // If paused, just change the track and keep it paused.
        setCurrentSongIndex(newIndex);
        const newSong = playlist[newIndex];
        audioElement.src = newSong.url;
    }
  }, [audioElement, fadeOut, fadeIn, volume, playlist, isPlaying]);
  
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
