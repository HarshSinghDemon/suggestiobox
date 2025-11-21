
'use client';

import { useAudio, type ArcadeTrack, type JokeboxTrack } from './audio-provider';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  Music,
  Youtube,
  Globe,
  Trash2
} from 'lucide-react';
import { DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const {
    playerMode,
    setPlayerMode,
    isPlaying,
    volume,
    setVolume,
    // Arcade
    arcadeTracklist,
    currentArcadeTrack,
    playPauseArcade,
    playNextArcade,
    playPrevArcade,
    playArcadeTrack,
    // Jokebox
    jokeboxPlaylist,
    currentJokeboxTrack,
    playPauseJokebox,
    playNextJokebox,
    playPrevJokebox,
    playJokeboxTrack,
    removeFromJokeboxPlaylist,
  } = useAudio();

  const isArcadeMode = playerMode === 'arcade';
  const currentTrack = isArcadeMode ? currentArcadeTrack : currentJokeboxTrack;
  const tracklist = isArcadeMode ? arcadeTracklist : jokeboxPlaylist;
  
  const handlePlayPause = isArcadeMode ? playPauseArcade : playPauseJokebox;
  const handlePlayNext = isArcadeMode ? playNextArcade : playNextJokebox;
  const handlePlayPrev = isArcadeMode ? playPrevArcade : playPrevJokebox;
  
  const getAnimationUrl = () => {
      return "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/The%20Dark%20Knight%20-%20Day%2019.gif";
  };

  const animationUrl = getAnimationUrl();
  
  const switchToJokebox = () => {
    setPlayerMode('jokebox');
    router.push('/jokebox');
  };

  const switchToArcade = () => {
    setPlayerMode('arcade');
  };
  
  const handleVolumeRocker = () => {
    if (volume > 0.5) setVolume(0.25); // from high to low
    else if (volume > 0) setVolume(0); // from low to mute
    else setVolume(1); // from mute to high
  };

  return (
    <div className="p-2 space-y-3 w-80">
      <DropdownMenuLabel className="text-center">{isArcadeMode ? 'Arcade Mix' : 'Jokebox Player'}</DropdownMenuLabel>
      <div className="relative w-40 h-40 mx-auto rounded-lg shadow-lg group">
          <Image
            src={animationUrl}
            alt="Music animation"
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
            <p className="text-xs text-muted-foreground">{isArcadeMode ? 'Website Track' : (currentTrack as JokeboxTrack).channel}</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePlayPrev} className="transition-transform active:scale-90">
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handlePlayPause} className="w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 pl-1" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePlayNext} className="transition-transform active:scale-90">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
            {/* Desktop Volume Slider */}
            <div className="hidden w-full md:flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => setVolume(value[0])}
                />
            </div>
            {/* Mobile Volume Rocker */}
            <Button variant="outline" size="icon" onClick={handleVolumeRocker} className="md:hidden">
              {volume > 0.5 ? <Volume2 className="w-5 h-5"/> : volume > 0 ? <Volume1 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
            </Button>
        </div>
      </div>
      <DropdownMenuSeparator />
      <div className="px-2">
        {isArcadeMode ? (
            <Button variant="outline" className="w-full" onClick={switchToJokebox}>
                <Globe className="w-4 h-4 mr-2" />
                Play from Internet
            </Button>
        ) : (
            <Button variant="outline" className="w-full" onClick={switchToArcade}>
                <Music className="w-4 h-4 mr-2" />
                Listen to Website Tracks
            </Button>
        )}
      </div>
      <ScrollArea className="h-48">
        <div className="px-2 space-y-1">
            {tracklist.map((track, index) => (
            <div
                key={isArcadeMode ? (track as ArcadeTrack).url : (track as JokeboxTrack).id}
                className={cn(
                    "w-full text-left p-2 rounded-md text-sm flex items-center gap-3 transition-all duration-200 group",
                    (isArcadeMode && currentArcadeTrack?.url === (track as ArcadeTrack).url) || (!isArcadeMode && currentJokeboxTrack?.id === (track as JokeboxTrack).id) ? "bg-primary/20 text-primary-foreground" : "hover:bg-accent/50",
                    "cursor-pointer"
                )}
                 onClick={() => isArcadeMode ? playArcadeTrack(index) : playJokeboxTrack(track as JokeboxTrack)}
            >
                {((isArcadeMode && currentArcadeTrack?.url === (track as ArcadeTrack).url) || (!isArcadeMode && currentJokeboxTrack?.id === (track as JokeboxTrack).id)) && isPlaying ? (
                    <SoundWave />
                ) : (
                    <Music className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{track.title}</span>
                 {!isArcadeMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromJokeboxPlaylist((track as JokeboxTrack).id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
            </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
