
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

const musicTracks = [
    { title: "Shinobi BGM 1", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/(Music)%20Shinobi%20-%20BGM%201%20(Arcade).mp3" },
    { title: "Arcade Game Loop", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Arcade%20game%20music%20loop%20%20free%20sound%20effects.mp3" },
    { title: "Cadillacs & Dinosaurs - Select", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Cadillacs%20And%20Dinosaurs%20-%20Player%20Select.mp3" },
    { title: "Pokemon Original Composition", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Pokimon%20Original%20Composition.mp3" },
    { title: "Street Fighter II - Opening", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Street%20Fighter%20II%20Arcade%20Music%20-%20Opening%20Theme%20-%20CPS1.mp3" },
];

type Track = {
  title: string;
  url: string;
};

interface AudioContextType {
  tracklist: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number | null;
  isPlaying: boolean;
  volume: number;
  playTrack: (index: number) => void;
  playPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = currentTrackIndex !== null ? musicTracks[currentTrackIndex] : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener('ended', () => playNext());
        audioRef.current.addEventListener('play', () => setIsPlaying(true));
        audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => playNext());
        audioRef.current.removeEventListener('play', () => setIsPlaying(true));
        audioRef.current.removeEventListener('pause', () => setIsPlaying(false));
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
      }
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  const playTrack = useCallback((index: number) => {
    if (index >= 0 && index < musicTracks.length) {
      if (currentTrackIndex === index) {
        // If it's the same track, just toggle play/pause
        playPause();
      } else {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
      }
    }
  }, [currentTrackIndex]);

  const playPause = useCallback(() => {
    if (!currentTrack) {
        // If no track is selected, play the first one
        setCurrentTrackIndex(0);
        setIsPlaying(true);
    } else {
        setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentTrack]);

  const playNext = useCallback(() => {
    if (currentTrackIndex !== null) {
      const nextIndex = (currentTrackIndex + 1) % musicTracks.length;
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
    } else {
        // If no track is playing, start with the first one
        setCurrentTrackIndex(0);
        setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  const playPrev = useCallback(() => {
    if (currentTrackIndex !== null) {
      const prevIndex = (currentTrackIndex - 1 + musicTracks.length) % musicTracks.length;
      setCurrentTrackIndex(prevIndex);
      setIsPlaying(true);
    } else {
      // If no track is playing, start with the last one
      setCurrentTrackIndex(musicTracks.length - 1);
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  const value = {
    tracklist: musicTracks,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    volume,
    playTrack,
    playPause,
    playNext,
    playPrev,
    setVolume,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
