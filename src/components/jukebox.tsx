'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { songs } from '@/lib/songs';

export function Jukebox() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = songs[currentSongIndex];

  const playNextSong = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
  }, []);

  const playPreviousSong = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }
  }, [currentSongIndex, isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
        <audio
            ref={audioRef}
            src={currentSong.url}
            onEnded={playNextSong}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            preload="auto"
        />
        <div className="flex items-center gap-4">
            <Music className="w-6 h-6 text-primary" />
            <div className="flex flex-col text-left">
                <p className="font-semibold text-sm truncate w-32">{currentSong.title}</p>
                <p className="text-xs text-muted-foreground">{currentSong.artist}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
            <Button variant="ghost" size="icon" onClick={playPreviousSong}>
                <SkipBack className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNextSong}>
                <SkipForward className="w-5 h-5" />
            </Button>
      </div>
    </div>
  );
}
