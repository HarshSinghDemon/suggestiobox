'use client';

import { useMusic } from '@/context/music-context';
import { Button } from './ui/button';
import { Play, Pause, SkipBack, SkipForward, Music, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';


export function JukeboxControls() {
  const { isPlaying, togglePlayPause, playNext, playPrevious, currentSong, volume, setVolume } = useMusic();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Skeleton className="w-10 h-10 rounded-full md:w-48" />;
  }
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };
  
  const MusicPlayerCore = (
    <div className="flex items-center gap-1 p-1 rounded-full bg-card/50 border border-border/20 shadow-sm backdrop-blur-sm transition-transform duration-300 ease-in-out group-hover:scale-105 active:scale-95">
        <div className={cn("flex items-center justify-center w-8 h-8", isPlaying && "animate-pulse")}>
            <Music className="w-4 h-4 text-muted-foreground" />
        </div>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className='w-8 h-8 rounded-full' onClick={playPrevious}>
                    <SkipBack className="w-4 h-4" />
                    <span className="sr-only">Previous Song</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>Previous</p>
            </TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                    className={cn(
                        "w-8 h-8 rounded-full transition-all duration-300 ease-in-out",
                        isPlaying ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400"
                    )}
                    >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>{isPlaying ? 'Pause' : 'Play'}</p>
            </TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className='w-8 h-8 rounded-full' onClick={playNext}>
                    <SkipForward className="w-4 h-4" />
                    <span className="sr-only">Next Song</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                 <p>Next</p>
            </TooltipContent>
        </Tooltip>
        
        <div className="flex-1 hidden pr-2 overflow-hidden text-left w-28 md:block">
            <p className="text-xs font-semibold truncate">{currentSong.title}</p>
            <p className="text-xs truncate text-muted-foreground">{currentSong.artist}</p>
        </div>
    </div>
  );

  return (
    <>
      {/* Desktop Player */}
      <div className='hidden md:block'>
        {MusicPlayerCore}
      </div>

      {/* Mobile Player with Popover */}
      <div className='block md:hidden'>
        <Popover>
          <PopoverTrigger asChild>
            {MusicPlayerCore}
          </PopoverTrigger>
          <PopoverContent className="w-64" side="bottom" align="end">
            <div className='space-y-4'>
              <div className='text-center'>
                <p className="font-semibold truncate">{currentSong.title}</p>
                <p className="text-sm truncate text-muted-foreground">{currentSong.artist}</p>
              </div>
              <div className='flex items-center gap-2'>
                <Volume2 className='w-4 h-4 text-muted-foreground' />
                <Slider 
                  defaultValue={[volume * 100]} 
                  max={100} 
                  step={1} 
                  onValueChange={(value) => handleVolumeChange([value[0] / 100])}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
