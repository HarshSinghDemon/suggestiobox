
'use client';

import { useAudio } from './audio-provider';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';
import { DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function MiniMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    playPause,
    playNext,
    playPrev,
    setVolume,
    volume,
    tracklist,
    playTrack,
  } = useAudio();

  if (!tracklist.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No music available.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-4">
      <DropdownMenuLabel>Arcade Mix</DropdownMenuLabel>
      <div className="px-2">
        {currentTrack && (
          <div className="mb-4 text-center">
            <p className="font-semibold truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground">Now Playing</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={playPrev}>
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={playPause} className="w-12 h-12">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Volume2 className="w-5 h-5" />
          <Slider
            defaultValue={[volume]}
            max={1}
            step={0.01}
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
      <DropdownMenuSeparator />
      <div className="max-h-64 overflow-y-auto px-2 space-y-1">
        {tracklist.map((track, index) => (
          <button
            key={index}
            onClick={() => playTrack(index)}
            className={cn(
                "w-full text-left p-2 rounded-md text-sm flex items-center gap-2",
                currentTrack?.url === track.url ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
            )}
          >
            <Music className="w-4 h-4" />
            <span className="truncate">{track.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
