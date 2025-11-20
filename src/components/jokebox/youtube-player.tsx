
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import YouTubePlayer from 'youtube-player';
import type { YouTubePlayer as YouTubePlayerType } from 'youtube-player/dist/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Play, Pause, Volume2, VolumeX, Music, SkipForward } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';

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
    const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const playerRef = useRef<YouTubePlayerType | null>(null);
    const playerDivRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const { results, isLoading, search } = useYouTubeSearch(apiKey);

    useEffect(() => {
        if (playerDivRef.current) {
            const player = YouTubePlayer(playerDivRef.current, {
                playerVars: {
                    autoplay: 1, // Autoplay on load
                    controls: 0, // Hide native controls
                },
                width: '100%',
                height: '0', // Hide player
            });
            playerRef.current = player;

            const onStateChange = (event: any) => {
                if (event.data === 1) setIsPlaying(true); // Playing
                else setIsPlaying(false); // Paused, ended, etc.
            };

            const onError = (event: any) => {
                console.error("YouTube Player Error:", event.data);
                toast({
                    variant: "destructive",
                    title: "Playback Error",
                    description: "This video could not be played. It might be private or restricted.",
                });
            };

            player.on('stateChange', onStateChange);
            player.on('error', onError);

            const interval = setInterval(async () => {
                if (player) {
                    const time = await player.getCurrentTime();
                    const dur = await player.getDuration();
                    if (dur > 0) {
                        setCurrentTime(time);
                        setDuration(dur);
                        setProgress((time / dur) * 100);
                    }
                }
            }, 500);

            return () => {
                clearInterval(interval);
                player.destroy();
            };
        }
    }, [toast]);

    const handleSelectTrack = useCallback((track: YouTubeSearchResult) => {
        setCurrentTrack(track);
        if (playerRef.current) {
            playerRef.current.mute(); // Mute before playing for autoplay
            playerRef.current.loadVideoById(track.id.videoId);
            playerRef.current.playVideo();
        }
    }, []);
    
    const playNextTrack = useCallback(() => {
        if (!currentTrack || results.length === 0) return;
        const currentIndex = results.findIndex(t => t.id.videoId === currentTrack.id.videoId);
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % results.length;
            handleSelectTrack(results[nextIndex]);
        }
    }, [currentTrack, results, handleSelectTrack]);


    const handlePlayPause = async () => {
        if (!playerRef.current) return;
        const playerState = await playerRef.current.getPlayerState();
        if (playerState === 1) { // is playing
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };
    
    const handleToggleMute = async () => {
        if (!playerRef.current) return;
        const muted = await playerRef.current.isMuted();
        if (muted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };
    
    const handleSeek = async (value: number[]) => {
        if (playerRef.current && duration > 0) {
            const newTime = (value[0] / 100) * duration;
            playerRef.current.seekTo(newTime, true);
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
            <div ref={playerDivRef} style={{ height: '0', overflow: 'hidden' }} />
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search for songs on YouTube..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button type="button" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            {currentTrack && (
                <Card className="p-4">
                  <CardContent className="p-0 space-y-3">
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
                        <Button variant="ghost" size="icon" onClick={playNextTrack} className="w-8 h-8 rounded-full">
                            <SkipForward className="w-4 h-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
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
