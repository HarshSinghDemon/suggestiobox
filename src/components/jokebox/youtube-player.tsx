
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
    Search, 
    Play, 
    Pause, 
    SkipForward, 
    SkipBack, 
    Volume2, 
    VolumeX, 
    Plus, 
    Trash2, 
    ListMusic,
    Loader2,
    Music2
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import createYouTubePlayer, { YouTubePlayer } from 'youtube-player';

interface YouTubeTrack {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
}

interface YouTubeSearchResult {
    id: { videoId: string };
    snippet: {
        title:string;
        channelTitle: string;
        thumbnails: { medium: { url: string }};
    };
}

interface YoutubePlayerProps {
    apiKey: string;
    className?: string;
}

export function YoutubePlayer({ apiKey, className }: YoutubePlayerProps) {
    const { toast } = useToast();

    // Search State
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);

    // Player State
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(50);

    // Playlist State
    const [playlist, setPlaylist] = useState<YouTubeTrack[]>([]);
    
    const playerRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const searchSongs = useCallback(async () => {
        if (!query.trim()) return;
        setIsLoading(true);

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=20&videoCategoryId=10&key=${apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || "API request failed. Check your API key or quota.");
            }
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                toast({ title: 'No songs found', description: `Your search for "${query}" returned no results.` });
                setSearchResults([]);
                return;
            }
            
            const decodedTitle = (title: string) => {
                const txt = document.createElement("textarea");
                txt.innerHTML = title;
                return txt.value;
            };

            const tracks: YouTubeTrack[] = data.items.map((item: YouTubeSearchResult) => ({
                id: item.id.videoId,
                title: decodedTitle(item.snippet.title),
                channel: decodedTitle(item.snippet.channelTitle),
                thumbnail: item.snippet.thumbnails.medium.url,
            }));
            setSearchResults(tracks);
        } catch (error: any) {
            console.error("YouTube Search Error:", error);
            toast({ variant: 'destructive', title: 'Search Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [query, toast, apiKey]);

    useEffect(() => {
        if (playerRef.current) {
            const ytPlayer = createYouTubePlayer(playerRef.current, {
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                },
            });
            setPlayer(ytPlayer);

            ytPlayer.on('stateChange', async (event) => {
                setIsPlaying(event.data === 1);
                if(event.data === 1) { // Playing
                    const videoDuration = await ytPlayer.getDuration();
                    setDuration(videoDuration);
                }
                if (event.data === 0) { // Ended
                    playNext();
                }
            });

            ytPlayer.on('error', (event) => {
                console.error("YouTube Player Error", event);
                toast({ variant: 'destructive', title: 'Playback Error', description: 'This video could not be played.' });
                playNext();
            });

            return () => {
                ytPlayer.destroy();
            };
        }
    }, [toast]);
    
    useEffect(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        if (isPlaying) {
            progressIntervalRef.current = setInterval(async () => {
                const currentTime = await player?.getCurrentTime();
                const videoDuration = await player?.getDuration();
                if (currentTime && videoDuration) {
                    setProgress((currentTime / videoDuration) * 100);
                }
            }, 1000);
        }
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPlaying, player]);

    const playSong = useCallback((track: YouTubeTrack) => {
        if (player) {
            player.mute();
            player.loadVideoById(track.id);
            player.playVideo();
            setCurrentTrack(track);
        }
    }, [player]);

    const togglePause = () => {
        if (!currentTrack || !player) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);
      player?.setVolume(newVolume);
    };

    const handleMuteToggle = () => {
        if (player?.isMuted()) {
            player.unMute();
        } else {
            player?.mute();
        }
    }
    
    const loadPlaylist = useCallback(() => {
        try {
            const savedPlaylist = localStorage.getItem('ytAudioPlaylist');
            if (savedPlaylist) setPlaylist(JSON.parse(savedPlaylist));
        } catch (error) {
            console.error("Failed to load playlist from localStorage", error);
        }
    }, []);
    
    useEffect(() => {
        loadPlaylist();
    }, [loadPlaylist]);

    const addToPlaylist = (song: YouTubeTrack) => {
        if (playlist.some(p => p.id === song.id)) {
            toast({ title: "Already in Playlist", description: `"${song.title}" is already in your playlist.` });
            return;
        }
        const newPlaylist = [...playlist, song];
        setPlaylist(newPlaylist);
        localStorage.setItem('ytAudioPlaylist', JSON.stringify(newPlaylist));
        toast({ title: "Added to Playlist", description: `"${song.title}" has been added.` });
    };

    const removeFromPlaylist = (songId: string) => {
        const newPlaylist = playlist.filter(p => p.id !== songId);
        setPlaylist(newPlaylist);
        localStorage.setItem('ytAudioPlaylist', JSON.stringify(newPlaylist));
    };

    const playNext = useCallback(() => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(p => p.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % playlist.length;
        playSong(playlist[nextIndex]);
    }, [currentTrack, playlist, playSong]);

    const playPrevious = useCallback(() => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(p => p.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        playSong(playlist[prevIndex]);
    }, [currentTrack, playlist, playSong]);

    const SearchResults = () => (
        <ScrollArea className='h-full'>
            <div className="p-1 sm:p-4 space-y-2">
                {isLoading && searchResults.length === 0 ? (
                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="w-full h-20 rounded-md" />)
                ) : searchResults.length > 0 ? (
                    searchResults.map((track, index) => (
                        <div key={track.id} 
                             className="flex items-center gap-3 p-2 rounded-md group hover:bg-accent animate-fade-in-up"
                             style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => addToPlaylist(track)}><Plus className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => playSong(track)}><Play className={cn("w-4 h-4", isPlaying && currentTrack?.id === track.id ? "text-amber-400" : "")}/></Button>
                            </div>
                            <div className='relative overflow-hidden rounded-md shrink-0 w-14 h-14'>
                                <Image src={track.thumbnail} alt={track.title} layout='fill' className="object-cover transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{track.title}</p>
                                <p className="text-sm truncate text-muted-foreground">{track.channel}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-24 animate-fade-in-scale">
                        <Music2 className="w-16 h-16 mb-4 text-primary/50" />
                        <h3 className='text-xl font-semibold'>Find Your Sound</h3>
                        <p className='max-w-xs text-sm'>Search for songs, artists, or albums to start building your playlist.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
    
    const Playlist = () => (
        <div className="flex flex-col h-full bg-background/50">
            <h3 className="p-4 text-lg font-semibold tracking-tight border-b">
                <ListMusic className="inline w-5 h-5 mr-2" />
                My Playlist
            </h3>
            <ScrollArea className='flex-1'>
                <div className="p-2 space-y-1">
                    {playlist.length > 0 ? (
                        playlist.map((track, index) => (
                            <div key={track.id} 
                                 className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer group hover:bg-accent animate-fade-in-up", currentTrack?.id === track.id && "bg-primary/20")}
                                 style={{ animationDelay: `${index * 50}ms` }}
                                 >
                                <div className="flex-1 min-w-0" onClick={() => playSong(track)}>
                                    <p className={cn("text-sm font-semibold truncate", currentTrack?.id === track.id && "text-amber-300")}>{track.title}</p>
                                    <p className="text-xs truncate text-muted-foreground">{track.channel}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="w-6 h-6 transition-opacity shrink-0 opacity-0 group-hover:opacity-100" onClick={() => removeFromPlaylist(track.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-12 animate-fade-in-scale">
                            <ListMusic className="w-10 h-10 mb-2" />
                            <p className="text-sm">Your playlist is empty.</p>
                            <p className="text-xs">Add songs from search results.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
    
    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || seconds === Infinity) {
          return '00:00';
        }
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return (
        <div className={cn("flex flex-col h-full", className)}>
             <div ref={playerRef} style={{ width: '1px', height: '1px', opacity: 0, position: 'absolute', top: '-100px' }}></div>

            <div className="flex-1 min-h-0 md:grid md:grid-cols-3">
                <div className="flex flex-col h-full md:col-span-2">
                    <div className="p-4 border-b">
                        <form onSubmit={(e) => { e.preventDefault(); searchSongs(); }} className="flex gap-2">
                            <Input
                                placeholder="Search songs, artists, albums..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className='text-base'
                            />
                            <Button type="submit" disabled={isLoading} className='shrink-0'>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                    <div className="flex-1 min-h-0">
                      <SearchResults />
                    </div>
                </div>
                <div className="hidden h-full border-l md:block">
                  <Playlist />
                </div>
            </div>

            <div className="p-3 border-t bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center flex-1 gap-3 min-w-0">
                        {currentTrack ? (
                            <Image src={currentTrack.thumbnail} alt={currentTrack.title} width={56} height={56} className={cn("rounded-md shadow-lg")} />
                        ) : (
                            <div className="flex items-center justify-center w-14 h-14 bg-muted rounded-md shrink-0"><Music2 className='w-6 h-6 text-muted-foreground' /></div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={cn("font-semibold truncate", isPlaying && "text-amber-300")}>{currentTrack?.title || 'No song selected'}</p>
                            <p className="text-sm truncate text-muted-foreground">{currentTrack?.channel || '---'}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-grow gap-2 max-w-xs">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={playPrevious} disabled={playlist.length < 2}><SkipBack /></Button>
                            <Button variant="default" size="icon" className="w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500" onClick={togglePause} disabled={!currentTrack}>
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 pl-0.5 fill-current" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={playNext} disabled={playlist.length < 2}><SkipForward /></Button>
                        </div>
                        <div className="flex items-center w-full gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{formatTime(progress / 100 * duration)}</span>
                            <Slider
                                value={[progress]}
                                max={100}
                                step={1}
                                className="w-full"
                                onValueChange={([value]) => { 
                                  if (player) {
                                    player.seekTo((value / 100) * duration, true);
                                  }
                                }}
                                disabled={!currentTrack}
                            />
                            <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="items-center hidden gap-2 md:flex">
                        <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                            {(volume === 0 || player?.isMuted()) ? <VolumeX className='text-muted-foreground' /> : <Volume2 className='text-muted-foreground' />}
                        </Button>
                        <Slider
                            value={[volume]}
                            max={100}
                            step={1}
                            className="w-24"
                            onValueChange={handleVolumeChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
