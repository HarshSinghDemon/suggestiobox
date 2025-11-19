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

  const playSongAtIndex = useCallback((songs: Song[], index: number) => {
    setPlaylist(songs);
    setCurrentSongIndex(index);
    if (audioElement) {
      audioElement.src = songs[index].url;
      if (isPlaying) {
        audioElement.play().catch(() => setIsPlaying(false));
      }
    }
  }, [audioElement, isPlaying]);

  const toggleInternetRadio = useCallback(async () => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      audioElement?.pause();
    }
    
    const turningOn = !isInternetRadio;
    setIsInternetRadio(turningOn);
    
    if (turningOn) {
      const newSongs = await fetchJamendoSongs(0);
      if (newSongs.length > 0) {
        playSongAtIndex(newSongs, 0);
      } else {
        // If fetching fails, revert back to local songs
        setIsInternetRadio(false);
        playSongAtIndex(localSongs, 0);
      }
    } else {
      playSongAtIndex(localSongs, 0);
    }
  }, [isInternetRadio, fetchJamendoSongs, playSongAtIndex, isPlaying, audioElement]);

  const togglePlayPause = useCallback(() => {
    if (!audioElement) return;

    if (audioElement.src && !audioElement.paused) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      // If src is not set or differs, this is the first play or a new song
      if (audioElement.src !== currentSong.url) {
        audioElement.src = currentSong.url;
      }
      audioElement.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Audio playback failed:", e);
        setIsPlaying(false);
      });
    }
  }, [audioElement, currentSong]);

  const playNext = useCallback(async () => {
    let nextIndex = currentSongIndex + 1;
    let currentPlaylist = playlist;

    if (nextIndex >= currentPlaylist.length) {
      if (isInternetRadio) {
        const moreSongs = await fetchJamendoSongs(jamendoOffset);
        if (moreSongs.length > 0) {
          const newPlaylist = [...currentPlaylist, ...moreSongs];
          setPlaylist(newPlaylist);
          // nextIndex remains correct as it's the start of the new batch
        } else {
          nextIndex = 0; // Loop back to start if no more songs can be fetched
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
    if (audio && currentSong) {
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
      }
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
