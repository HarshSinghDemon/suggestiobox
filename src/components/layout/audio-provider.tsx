
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
import createYouTubePlayer, { YouTubePlayer } from 'youtube-player';
import { useToast } from '@/hooks/use-toast';

// --- Types ---
const arcadeMusicTracks = [
    { title: "Shinobi BGM 1", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/(Music)%20Shinobi%20-%20BGM%201%20(Arcade).mp3" },
    { title: "Arcade Game Loop", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Arcade%20game%20music%20loop%20%20free%20sound%20effects.mp3" },
    { title: "Cadillacs & Dinosaurs - Select", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Cadillacs%20And%20Dinosaurs%20-%20Player%20Select.mp3" },
    { title: "Street Fighter II - Opening", url: "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/music/Street%20Fighter%20II%20Arcade%20Music%20-%20Opening%20Theme%20-%20CPS1.mp3" },
    { title: "Sonic - Green Hill Zone", url: "https://ik.imagekit.io/bt0k47tzc/green_hill_zone.mp3?updatedAt=1763670098871" },
    { title: "Super Mario Bros. Theme", url: "https://ik.imagekit.io/bt0k47tzc/supermario.mp3?updatedAt=1763670098578" },
    { title: "Mega Man 2 - Dr. Wily Stage", url: "https://ik.imagekit.io/bt0k47tzc/megaman.mp3?updatedAt=1763670097812" },
    { title: "Dragon Ball Z - Cha-La Head-Cha-La", url: "https://ik.imagekit.io/bt0k47tzc/dragon_ball.mp3?updatedAt=1763670096714" },
    { title: "Street Fighter - Ryu's Theme", url: "https://ik.imagekit.io/bt0k47tzc/ryu.mp3?updatedAt=1763670096135" },
    { title: "Ben 10 Theme Song", url: "https://ik.imagekit.io/bt0k47tzc/ben10.mp3?updatedAt=1763670095075" },
    { title: "Pokemon Theme Song", url: "https://ik.imagekit.io/bt0k47tzc/pokemon.mp3?updatedAt=1763670094935" },
];

export type ArcadeTrack = {
  title: string;
  url: string;
};

export type JokeboxTrack = {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
};

type PlayerMode = 'arcade' | 'jokebox';

interface AudioContextType {
  // General State
  playerMode: PlayerMode;
  setPlayerMode: (mode: PlayerMode) => void;
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  
  // Arcade Player State & Controls
  arcadeTracklist: ArcadeTrack[];
  currentArcadeTrack: ArcadeTrack | null;
  playPauseArcade: () => void;
  playNextArcade: () => void;
  playPrevArcade: () => void;
  playArcadeTrack: (index: number) => void;
  
  // Jokebox Player State & Controls
  jokeboxPlaylist: JokeboxTrack[];
  setJokeboxPlaylist: React.Dispatch<React.SetStateAction<JokeboxTrack[]>>;
  currentJokeboxTrack: JokeboxTrack | null;
  isJokeboxPlaying: boolean;
  isJokeboxReady: boolean;
  playPauseJokebox: () => void;
  playNextJokebox: () => void;
  playPrevJokebox: () => void;
  playJokeboxTrack: (track: JokeboxTrack) => void;
  addToJokeboxPlaylist: (track: JokeboxTrack) => void;
  removeFromJokeboxPlaylist: (trackId: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// --- Provider Component ---
export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [playerMode, setPlayerMode] = useState<PlayerMode>('arcade');
  
  // --- Arcade State ---
  const [currentArcadeTrackIndex, setCurrentArcadeTrackIndex] = useState<number | null>(null);
  const [isArcadePlaying, setIsArcadePlaying] = useState(false);
  const arcadeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [arcadeVolume, setArcadeVolume] = useState(0.1);

  // --- Jokebox State ---
  const [jokeboxPlaylist, setJokeboxPlaylist] = useState<JokeboxTrack[]>([]);
  const [currentJokeboxTrackIndex, setCurrentJokeboxTrackIndex] = useState<number | null>(null);
  const [isJokeboxPlaying, setIsJokeboxPlaying] = useState(false);
  const [isJokeboxReady, setIsJokeboxReady] = useState(false);
  const [jokeboxVolume, setJokeboxVolume] = useState(50);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  
  // --- Combined State ---
  const isPlaying = playerMode === 'arcade' ? isArcadePlaying : isJokeboxPlaying;
  const volume = playerMode === 'arcade' ? arcadeVolume : jokeboxVolume / 100;
  
  const setVolume = (newVolume: number) => {
      if (playerMode === 'arcade') {
          setArcadeVolume(newVolume);
          if(arcadeAudioRef.current) arcadeAudioRef.current.volume = newVolume;
      } else {
          setJokeboxVolume(newVolume * 100);
          ytPlayerRef.current?.setVolume(newVolume * 100);
      }
  };

  // --- Arcade Logic ---
  const currentArcadeTrack = currentArcadeTrackIndex !== null ? arcadeMusicTracks[currentArcadeTrackIndex] : null;

  const playRandomArcadeTrack = useCallback(() => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * arcadeMusicTracks.length);
    } while (nextIndex === currentArcadeTrackIndex && arcadeMusicTracks.length > 1);
    setCurrentArcadeTrackIndex(nextIndex);
    setIsArcadePlaying(true);
  }, [currentArcadeTrackIndex]);
  
  const playArcadeTrack = useCallback((index: number) => {
    if (index >= 0 && index < arcadeMusicTracks.length) {
      if (playerMode !== 'arcade') setPlayerMode('arcade');
      if (currentArcadeTrackIndex === index) {
        setIsArcadePlaying(prev => !prev);
      } else {
        setCurrentArcadeTrackIndex(index);
        setIsArcadePlaying(true);
      }
    }
  }, [currentArcadeTrackIndex, playerMode]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !arcadeAudioRef.current) {
        arcadeAudioRef.current = new Audio();
        arcadeAudioRef.current.volume = arcadeVolume;
    }
  }, [arcadeVolume]);
  
  useEffect(() => {
    const audio = arcadeAudioRef.current;
    if (!audio) return;
  
    const handleEnded = () => playRandomArcadeTrack();
    const handlePlay = () => { if(playerMode === 'arcade') setIsArcadePlaying(true) };
    const handlePause = () => setIsArcadePlaying(false);
  
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
  
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playRandomArcadeTrack, playerMode]);

  useEffect(() => {
    const audio = arcadeAudioRef.current;
    if (!audio) return;
  
    if (playerMode === 'arcade' && currentArcadeTrack) {
        if (audio.src !== currentArcadeTrack.url) {
            audio.src = currentArcadeTrack.url;
        }
        isArcadePlaying ? audio.play().catch(e => console.error("Arcade play error", e)) : audio.pause();
    } else {
        audio.pause();
    }
  }, [playerMode, currentArcadeTrack, isArcadePlaying]);


  const playPauseArcade = () => {
    if (playerMode !== 'arcade') setPlayerMode('arcade');
    if (currentArcadeTrackIndex === null) {
      playRandomArcadeTrack();
    } else {
      setIsArcadePlaying(prev => !prev);
    }
  };
  
  const playNextArcade = useCallback(() => {
    if (playerMode !== 'arcade') setPlayerMode('arcade');
    playRandomArcadeTrack();
  }, [playerMode, playRandomArcadeTrack]);
  
  const playPrevArcade = useCallback(() => {
    if (playerMode !== 'arcade') setPlayerMode('arcade');
    playRandomArcadeTrack(); // just play another random for prev
  }, [playerMode, playRandomArcadeTrack]);
  
  // --- Jokebox Logic ---
  const currentJokeboxTrack = currentJokeboxTrackIndex !== null ? jokeboxPlaylist[currentJokeboxTrackIndex] : null;

   const playJokeboxTrack = useCallback((track: JokeboxTrack) => {
        const trackIndex = jokeboxPlaylist.findIndex(t => t.id === track.id);
        if (playerMode !== 'jokebox') setPlayerMode('jokebox');

        if (trackIndex !== -1) {
            // If same track is clicked, toggle play/pause
            if (currentJokeboxTrackIndex === trackIndex) {
                setIsJokeboxPlaying(prev => !prev);
            } else {
                setCurrentJokeboxTrackIndex(trackIndex);
                setIsJokeboxPlaying(true);
            }
        } else {
            const newPlaylist = [...jokeboxPlaylist, track];
            setJokeboxPlaylist(newPlaylist);
            setCurrentJokeboxTrackIndex(newPlaylist.length - 1);
            setIsJokeboxPlaying(true);
        }
    }, [jokeboxPlaylist, playerMode, currentJokeboxTrackIndex]);

  const playNextJokebox = useCallback(() => {
        if (jokeboxPlaylist.length === 0) return;
        const nextIndex = (currentJokeboxTrackIndex! + 1) % jokeboxPlaylist.length;
        setCurrentJokeboxTrackIndex(nextIndex);
        setIsJokeboxPlaying(true);
  }, [currentJokeboxTrackIndex, jokeboxPlaylist]);

  const playPrevJokebox = useCallback(() => {
    if (jokeboxPlaylist.length === 0) return;
    const prevIndex = (currentJokeboxTrackIndex! - 1 + jokeboxPlaylist.length) % jokeboxPlaylist.length;
    setCurrentJokeboxTrackIndex(prevIndex);
    setIsJokeboxPlaying(true);
  }, [currentJokeboxTrackIndex, jokeboxPlaylist]);


  useEffect(() => {
    const initializePlayer = () => {
      if (ytPlayerRef.current || typeof window === 'undefined') return;

      const container = document.createElement('div');
      container.id = 'yt-player-container';
      container.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
      document.body.appendChild(container);
      playerContainerRef.current = container;

      const player = createYouTubePlayer(container, {
          playerVars: { controls: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
      });
      ytPlayerRef.current = player;
      setIsJokeboxReady(true);
      
      player.on('stateChange', async (event) => {
          if (event.data === 1) setIsJokeboxPlaying(true); // Playing
          if (event.data === 2) setIsJokeboxPlaying(false); // Paused
          if (event.data === 0) { // Ended
              playNextJokebox();
          }
      });
      
      player.on('error', (event) => {
          console.error("YouTube Player Error:", event);
          toast({ variant: 'destructive', title: 'Playback Error', description: 'This video could not be played. Skipping to next.' });
          playNextJokebox();
      });
    };

    initializePlayer();

    return () => {
        if (ytPlayerRef.current) {
            ytPlayerRef.current?.destroy();
            ytPlayerRef.current = null;
            if (playerContainerRef.current && playerContainerRef.current.parentNode === document.body) {
                document.body.removeChild(playerContainerRef.current);
            }
        }
    }
  }, [toast, playNextJokebox]);
  
  useEffect(() => {
    if(playerMode === 'jokebox') {
        setIsArcadePlaying(false); // Ensure arcade is paused
        if (currentJokeboxTrack && ytPlayerRef.current) {
            if (isJokeboxPlaying) {
                ytPlayerRef.current.loadVideoById(currentJokeboxTrack.id);
                ytPlayerRef.current.playVideo();
            } else {
                ytPlayerRef.current.pauseVideo();
            }
        } else if (!currentJokeboxTrack) {
            ytPlayerRef.current?.stopVideo();
        }
    } else if (playerMode === 'arcade') {
        setIsJokeboxPlaying(false); // Ensure jokebox is paused
        ytPlayerRef.current?.pauseVideo();
    }
  }, [playerMode, currentJokeboxTrack, isJokeboxPlaying]);
  

  const playPauseJokebox = () => {
    if (playerMode !== 'jokebox') {
      setPlayerMode('jokebox');
      if (jokeboxPlaylist.length > 0 && currentJokeboxTrackIndex === null) {
        setCurrentJokeboxTrackIndex(0);
        setIsJokeboxPlaying(true);
      } else {
        setIsJokeboxPlaying(true);
      }
    } else {
      if (!currentJokeboxTrack && jokeboxPlaylist.length > 0) {
        setCurrentJokeboxTrackIndex(0);
        setIsJokeboxPlaying(true);
      } else {
        setIsJokeboxPlaying(prev => !prev);
      }
    }
  };
  
    const addToJokeboxPlaylist = (track: JokeboxTrack) => {
        setJokeboxPlaylist(prev => {
            if (prev.some(t => t.id === track.id)) {
                toast({ title: "Already in Playlist", description: `"${track.title}" is already in your playlist.` });
                return prev;
            }
            const newPlaylist = [...prev, track];
            localStorage.setItem('ytJokeboxPlaylist', JSON.stringify(newPlaylist));
            toast({ title: "Added to Playlist", description: `"${track.title}" has been added.` });
            return newPlaylist;
        });
    };

    const removeFromJokeboxPlaylist = (trackId: string) => {
        setJokeboxPlaylist(prev => {
            const newPlaylist = prev.filter(t => t.id !== trackId);
            localStorage.setItem('ytJokeboxPlaylist', JSON.stringify(newPlaylist));
            if(currentJokeboxTrack?.id === trackId){
                ytPlayerRef.current?.stopVideo();
                setCurrentJokeboxTrackIndex(null);
                setIsJokeboxPlaying(false);
            }
            return newPlaylist;
        });
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ytJokeboxPlaylist');
            if (saved) setJokeboxPlaylist(JSON.parse(saved));
        } catch (e) { console.error("Failed to load playlist", e); }
    }, []);


  const value: AudioContextType = {
    playerMode,
    setPlayerMode,
    isPlaying,
    volume,
    setVolume,
    // Arcade
    arcadeTracklist: arcadeMusicTracks,
    currentArcadeTrack,
    playPauseArcade,
    playNextArcade,
    playPrevArcade,
    playArcadeTrack,
    // Jokebox
    jokeboxPlaylist,
    setJokeboxPlaylist,
    currentJokeboxTrack,
    isJokeboxPlaying,
    isJokeboxReady,
    playPauseJokebox,
    playNextJokebox,
    playPrevJokebox,
    playJokeboxTrack,
    addToJokeboxPlaylist,
    removeFromJokeboxPlaylist,
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

    