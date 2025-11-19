'use client';

import { useMusic } from '@/context/music-context';
import { Button } from './ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export function JukeboxControls() {
  const { isPlaying, togglePlayPause, playNext, playPrevious, currentSong } = useMusic();
  
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-card/50 border border-border/20 shadow-sm backdrop-blur-sm">
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className='w-8 h-8' onClick={playPrevious}>
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
                        "w-10 h-10 rounded-full transition-all duration-300 ease-in-out",
                        isPlaying ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400"
                    )}
                    >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>{isPlaying ? 'Pause' : 'Play'}</p>
            </TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className='w-8 h-8' onClick={playNext}>
                    <SkipForward className="w-4 h-4" />
                    <span className="sr-only">Next Song</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                 <p>Next</p>
            </TooltipContent>
        </Tooltip>
        <div className="flex flex-col items-start pl-2 pr-3 overflow-hidden text-left w-28">
            <p className="text-xs font-semibold truncate">{currentSong.title}</p>
            <p className="text-xs truncate text-muted-foreground">{currentSong.artist}</p>
        </div>
    </div>
  );
}
