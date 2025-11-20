
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import YouTubePlayer from 'youtube-player';
import type { YouTubePlayer as YouTubePlayerType } from 'youtube-player/dist/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Types for YouTube API response
interface YouTubeSearchResult {
    id: { videoId: string };
    snippet: {
        title: string;
        channelTitle: string;
        thumbnails: {
            default: { url: string };
            medium: { url: string };
        };
    };
}

interface YouTubeSearchResponse {
    items: YouTubeSearchResult[];
}

const useYouTubeSearch = (apiKey: string) => {
    const [results, setResults] = useState<YouTubeSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const search = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setResults([]);

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=20&key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'YouTube API request failed.');
            }
            const data: YouTubeSearchResponse = await response.json();
            if (data.items.length === 0) {
                toast({ title: 'No Results', description: `No music found for "${query}".` });
            }
            setResults(data.items);
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'API Error', description: err.message || 'An unknown error occurred.' });
            console.error("YouTube search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, toast]);

    return { results, isLoading, search };
};

export function YoutubePlayer({ apiKey }: { apiKey: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTrack, setCurrentTrack] = useState<YouTubeSearchResult | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const playerRef = useRef<YouTubePlayerType | null>(null);
    const playerDivRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const { toast } = useToast();
    const { results, isLoading, search } = useYouTubeSearch(apiKey);

    useEffect(() => {
        if (!playerDivRef.current) return;

        const player = YouTubePlayer(playerDivRef.current, {
            playerVars: {
                autoplay: 1,
                controls: 0,
                fs: 0,
                iv_load_policy: 3,
                loop: 0,
                modestbranding: 1,
                playsinline: 1,
            },
        });
        
        playerRef.current = player;

        player.on('stateChange', (event) => {
            if (event.data === 1) { // Playing
                setIsPlaying(true);
            } else if (event.data === 2 || event.data === 0) { // Paused or Ended
                setIsPlaying(false);
            }
        });

        player.on('error', (event) => {
            console.error("YouTube Player Error", event.data);
            toast({
                variant: 'destructive',
                title: 'Playback Error',
                description: 'Could not play the selected track. It may be restricted.'
            });
        });

        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            player.destroy();
        };
    }, [toast]);
    
    useEffect(() => {
        if (isPlaying) {
            progressIntervalRef.current = setInterval(async () => {
                const elapsed = await playerRef.current?.getCurrentTime();
                const totalDuration = await playerRef.current?.getDuration();
                if (elapsed !== undefined && totalDuration !== undefined && totalDuration > 0) {
                    setCurrentTime(elapsed);
                    setDuration(totalDuration);
                    setProgress((elapsed / totalDuration) * 100);
                }
            }, 1000);
        } else {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [isPlaying]);


    const handleSelectTrack = (track: YouTubeSearchResult) => {
        const player = playerRef.current;
        if (!player) return;

        setCurrentTrack(track);
        player.loadVideoById(track.id.videoId);
        player.mute(); 
        setIsMuted(true);
        player.playVideo();
    };

    const handlePlayPause = () => {
        const player = playerRef.current;
        if (!player) return;

        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    };
    
    const handleToggleMute = () => {
        const player = playerRef.current;
        if (!player) return;

        if (isMuted) {
            player.unMute();
            setIsMuted(false);
        } else {
            player.mute();
            setIsMuted(true);
        }
    };
    
    const handleSeek = (value: number[]) => {
        const player = playerRef.current;
        if (player && duration > 0) {
            const newTime = (value[0] / 100) * duration;
            player.seekTo(newTime, true);
        }
    };

    const handleSearch = () => {
        search(searchTerm);
    };


    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === Infinity) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const LoadingSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="w-12 h-12 rounded-md" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search for songs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button type="button" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            {/* Hidden Player */}
            <div ref={playerDivRef} style={{ position: 'absolute', top: -9999, left: -9999, width: 1, height: 1, opacity: 0 }}></div>

            {currentTrack && (
                <div className="p-4 space-y-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-4">
                        <Image src={currentTrack.snippet.thumbnails.medium.url} alt={currentTrack.snippet.title} width={64} height={64} className="rounded-md" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate text-primary">{currentTrack.snippet.title}</p>
                            <p className="text-sm truncate text-muted-foreground">{currentTrack.snippet.channelTitle}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handlePlayPause} className="w-12 h-12 rounded-full">
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 pl-1" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleToggleMute} className="w-8 h-8 rounded-full">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                        <Slider
                            value={[progress]}
                            max={100}
                            step={1}
                            onValueChange={handleSeek}
                            className="w-full"
                        />
                        <span className="text-xs font-mono">{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {isLoading ? <LoadingSkeleton /> :
                 results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                        {results.map((track) => (
                            <div 
                                key={track.id.videoId} 
                                className={cn(
                                    "flex items-center gap-4 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent",
                                    currentTrack?.id.videoId === track.id.videoId && 'bg-accent'
                                )} 
                                onClick={() => handleSelectTrack(track)} 
                                tabIndex={0} 
                                onKeyDown={(e) => e.key === 'Enter' && handleSelectTrack(track)}
                            >
                                <Image src={track.snippet.thumbnails.default.url} alt={track.snippet.title} width={48} height={48} className="object-cover rounded" />
                                <div className="flex-1 truncate">
                                    <p className="font-semibold truncate">{track.snippet.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">{track.snippet.channelTitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="py-8 text-center text-muted-foreground">Search for music to get started.</p>
                 )
                }
            </div>
        </div>
    );
}
