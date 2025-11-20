
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
    { title: "Green Hill Zone", url: "https://ik.imagekit.io/bt0k47tzc/green_hill_zone.mp3?updatedAt=1763670098871" },
    { title: "Super Mario Bros. Theme", url: "https://ik.imagekit.io/bt0k47tzc/supermario.mp3?updatedAt=1763670098578" },
    { title: "Mega Man 2 - Dr. Wily", url: "https://ik.imagekit.io/bt0k47tzc/megaman.mp3?updatedAt=1763670097812" },
    { title: "Dragon Ball Z - Cha-La", url: "https://ik.imagekit.io/bt0k47tzc/dragon_ball.mp3?updatedAt=1763670096714" },
    { title: "Ryu's Theme", url: "https://ik.imagekit.io/bt0k47tzc/ryu.mp3?updatedAt=1763670096135" },
    { title: "Ben 10 Theme", url: "https://ik.imagekit.io/bt0k47tzc/ben10.mp3?updatedAt=1763670095075" },
    { title: "Pokémon Theme", url: "https://ik.imagekit.io/bt0k47tzc/pokemon.mp3?updatedAt=1763670094935" },
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

  const playNext = useCallback(() => {
    setCurrentTrackIndex(prevIndex => {
      const nextIndex = prevIndex !== null ? (prevIndex + 1) % musicTracks.length : 0;
      return nextIndex;
    });
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
    }
  }, []);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => playNext();
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      }
    }
  }, [playNext]);

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
    } else if (!currentTrack && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }
  }, [currentTrack, isPlaying]);

  const playTrack = useCallback((index: number) => {
    if (index >= 0 && index < musicTracks.length) {
      if (currentTrackIndex === index) {
        setIsPlaying(prev => !prev);
      } else {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
      }
    }
  }, [currentTrackIndex]);

  const playPause = useCallback(() => {
    if (currentTrackIndex === null) {
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentTrackIndex]);

  const playPrev = useCallback(() => {
    const prevIndex = currentTrackIndex !== null ? (currentTrackIndex - 1 + musicTracks.length) % musicTracks.length : musicTracks.length - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
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
