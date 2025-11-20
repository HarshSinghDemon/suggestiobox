
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
  
  const getAnimationUrl = () => {
    switch (currentTrack?.title) {
      case 'Ben 10 Theme':
        return "https://ik.imagekit.io/bt0k47tzc/ben10-four-arms.gif?updatedAt=1763670807759";
      case 'Dragon Ball Z - Cha-La':
        return "https://ik.imagekit.io/bt0k47tzc/lr-agl-super-saiyan-god-ss-goku-and-super-saiyan-god-ss-vegeta-all-out-final-battle.gif?updatedAt=1763670802637";
      case 'Pokémon Theme':
        return "https://ik.imagekit.io/bt0k47tzc/pikachu-haki-captain-pikachu.gif?updatedAt=1763670804016";
      default:
        return "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/The%20Dark%20Knight%20-%20Day%2019.gif";
    }
  };

  const animationUrl = getAnimationUrl();


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
      <div className="relative w-40 h-40 mx-auto rounded-lg shadow-lg group">
          <Image
            src={animationUrl}
            alt="Arcade animation"
            fill
            className="object-cover rounded-lg"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
           {isPlaying && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center h-8 bg-black/50 backdrop-blur-sm rounded-b-lg">
                <div className="flex items-center justify-center gap-1">
                    <span className="w-1 h-2 bg-white/70 rounded-full animate-sound-wave [animation-delay:-0.4s]"></span>
                    <span className="w-1 h-4 bg-white/80 rounded-full animate-sound-wave [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-5 bg-white rounded-full animate-sound-wave [animation-delay:-0.2s]"></span>
                    <span className="w-1 h-5 bg-white rounded-full animate-sound-wave [animation-delay:-0.1s]"></span>
                    <span className="w-1 h-4 bg-white/80 rounded-full animate-sound-wave"></span>
                    <span className="w-1 h-2 bg-white/70 rounded-full animate-sound-wave [animation-delay:-0.2s]"></span>
                </div>
              </div>
            )}
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
