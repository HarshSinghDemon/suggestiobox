'use client';

import { songs as localSongs } from '@/lib/songs';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type Song = {
  title: string;
  artist: string;
  url: string;
};

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
}

interface MusicContextType {
  isPlaying: boolean;
  currentSong: Song;
  volume: number;
  isInternetRadio: boolean;
  isLoadingInternetRadio: boolean;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  setVolume: (volume: number) => void;
  toggleInternetRadio: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const JAMENDO_CLIENT_ID = '3d159494';
const JAMENDO_API_URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=20&audioformat=mp31&include=musicinfo&boost=popularity_month`;

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [playlist, setPlaylist] = useState<Song[]>(localSongs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(0.3); // Default volume
  const [isInternetRadio, setIsInternetRadio] = useState(false);
  const [isLoadingInternetRadio, setIsLoadingInternetRadio] = useState(false);
  const [jamendoOffset, setJamendoOffset] = useState(0);
  const { toast } = useToast();

  const currentSong = playlist[currentSongIndex] || localSongs[0];

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume;
    }
  }, [volume, audioElement]);

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  };
  
  const fetchJamendoSongs = useCallback(async (offset: number) => {
    setIsLoadingInternetRadio(true);
    try {
      const response = await fetch(`${JAMENDO_API_URL}&offset=${offset}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const newSongs: Song[] = data.results.map((track: JamendoTrack) => ({
          title: track.name,
          artist: track.artist_name,
          url: track.audio,
        }));
        setJamendoOffset(offset + newSongs.length);
        return newSongs;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch songs from Jamendo:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch music from the internet.' });
      return [];
    } finally {
      setIsLoadingInternetRadio(false);
    }
  }, [toast]);

  const toggleInternetRadio = useCallback(async () => {
    const turningOn = !isInternetRadio;
    setIsInternetRadio(turningOn);
    
    if (turningOn) {
      const newSongs = await fetchJamendoSongs(0);
      if (newSongs.length > 0) {
        setPlaylist(newSongs);
        setCurrentSongIndex(0);
        if (isPlaying) {
          // If already playing, continue playing with new playlist
          if (audioElement) {
            audioElement.src = newSongs[0].url;
            audioElement.play().catch(() => {});
          }
        }
      } else {
        // If fetching fails, revert back
        setIsInternetRadio(false);
      }
    } else {
      setPlaylist(localSongs);
      setCurrentSongIndex(0);
       if (isPlaying && audioElement) {
         audioElement.src = localSongs[0].url;
         audioElement.play().catch(() => {});
       }
    }
  }, [isInternetRadio, fetchJamendoSongs, isPlaying, audioElement]);

  const togglePlayPause = useCallback(() => {
    if (!audioElement) return;

    if (audioElement.paused) {
      audioElement.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audioElement.pause();
      setIsPlaying(false);
    }
  }, [audioElement]);

  const playNext = useCallback(async () => {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= playlist.length) {
      if (isInternetRadio) {
        const moreSongs = await fetchJamendoSongs(jamendoOffset);
        if (moreSongs.length > 0) {
          setPlaylist(prev => [...prev, ...moreSongs]);
          // Next index remains the same as it's the start of the new batch
        } else {
          // Loop back to start if no more songs can be fetched
          nextIndex = 0;
        }
      } else {
        nextIndex = 0; // Loop local playlist
      }
    }
    setCurrentSongIndex(nextIndex);
  }, [currentSongIndex, playlist, isInternetRadio, fetchJamendoSongs, jamendoOffset]);

  const playPrevious = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);
  
  useEffect(() => {
    const audio = audioElement;
    if (audio) {
        audio.src = currentSong.url;
        if(isPlaying) {
            audio.play().catch(() => {});
        }
    }
  }, [currentSong, audioElement, isPlaying]);


  const value: MusicContextType = {
    isPlaying,
    currentSong,
    volume,
    isInternetRadio,
    isLoadingInternetRadio,
    togglePlayPause,
    playNext,
    playPrevious,
    setAudioElement,
    setVolume,
    toggleInternetRadio,
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
