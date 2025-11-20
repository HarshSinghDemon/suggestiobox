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
  Music,
} from 'lucide-react';
import { DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';

const SoundWave = () => (
    <div className="flex items-center justify-center gap-0.5 w-4 h-4">
        <span className="w-0.5 h-2 bg-primary/80 rounded-full animate-sound-wave [animation-delay:-0.3s]"></span>
        <span className="w-0.5 h-3 bg-primary rounded-full animate-sound-wave [animation-delay:-0.15s]"></span>
        <span className="w-0.5 h-4 bg-primary rounded-full animate-sound-wave"></span>
        <span className="w-0.5 h-3 bg-primary rounded-full animate-sound-wave [animation-delay:-0.15s]"></span>
        <span className="w-0.5 h-2 bg-primary/80 rounded-full animate-sound-wave [animation-delay:-0.3s]"></span>
    </div>
);


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
    currentTrackIndex
  } = useAudio();

  if (!tracklist.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No music available.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3 w-80">
      <DropdownMenuLabel className="text-center">Arcade Mix</DropdownMenuLabel>
      <div className="relative mx-auto w-40 h-40 rounded-lg overflow-hidden shadow-lg group">
          <Image 
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3pob2lxdno3ZTIxZGE1Z3c0YWJ2bmdmZTF6ZGNmMG5qa3M2Z2U1ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/r51h07eZ25w62n3fve/giphy.gif"
            alt="Arcade animation"
            width={160}
            height={160}
            className="w-full h-full object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            {isPlaying && (
              <div className="flex items-center justify-center gap-1">
                <span className="w-1 h-4 bg-white/80 rounded-full animate-sound-wave [animation-delay:-0.4s]"></span>
                <span className="w-1 h-8 bg-white rounded-full animate-sound-wave [animation-delay:-0.2s]"></span>
                <span className="w-1 h-6 bg-white/90 rounded-full animate-sound-wave"></span>
                <span className="w-1 h-8 bg-white rounded-full animate-sound-wave [animation-delay:-0.2s]"></span>
                <span className="w-1 h-4 bg-white/80 rounded-full animate-sound-wave [animation-delay:-0.4s]"></span>
              </div>
            )}
          </div>
      </div>
      <div className="px-2 space-y-3">
        {currentTrack && (
          <div className="mb-2 text-center">
            <p className="font-semibold truncate text-primary">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground">Now Playing</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={playPrev} className="transition-transform active:scale-90">
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={playPause} className="w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 pl-1" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext} className="transition-transform active:scale-90">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <Slider
            defaultValue={[volume]}
            max={1}
            step={0.01}
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
      <DropdownMenuSeparator />
      <ScrollArea className="h-48">
        <div className="px-2 space-y-1">
            {tracklist.map((track, index) => (
            <button
                key={index}
                onClick={() => playTrack(index)}
                className={cn(
                    "w-full text-left p-2 rounded-md text-sm flex items-center gap-3 transition-all duration-200",
                    currentTrackIndex === index ? "bg-primary/20 text-primary-foreground" : "hover:bg-accent/50"
                )}
            >
                {currentTrackIndex === index && isPlaying ? (
                    <SoundWave />
                ) : (
                    <Music className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{track.title}</span>
            </button>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
