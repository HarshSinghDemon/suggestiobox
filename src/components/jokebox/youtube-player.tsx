
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import YouTubePlayer from 'youtube-player';
import type { YouTubePlayer as YouTubePlayerType } from 'youtube-player/dist/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Play, Pause } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';

// Types for YouTube API response
interface YouTubeSearchResult {
    id: { videoId: string };
    snippet: {
        title: string;
        channelTitle: string;
        thumbnails: {
            default: { url: string };
            medium: { url: string };
            high: { url: string };
        };
    };
}

interface YouTubeSearchResponse {
    items: YouTubeSearchResult[];
}

// Custom hook for YouTube search
const useYouTubeSearch = (apiKey: string) => {
    const [results, setResults] = useState<YouTubeSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const search = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResults([]);

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'YouTube API request failed.');
            }
            const data: YouTubeSearchResponse = await response.json();
            if (data.items.length === 0) {
                toast({ title: 'No Results', description: `No videos found for "${query}".` });
            }
            setResults(data.items);
        } catch (err: any) {
            setError(`Failed to fetch videos. Please check the API key and try again.`);
            toast({ variant: 'destructive', title: 'API Error', description: err.message || 'An unknown error occurred.' });
            console.error("YouTube search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, toast]);

    return { results, isLoading, error, search };
};

export function YoutubePlayer({ apiKey }: { apiKey: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTrack, setCurrentTrack] = useState<YouTubeSearchResult | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    const playerRef = useRef<YouTubePlayerType | null>(null);
    const playerDivRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { results, isLoading, error, search } = useYouTubeSearch(apiKey);

    useEffect(() => {
        // Initialize the YouTube player
        if (playerDivRef.current && !playerRef.current) {
            const player = YouTubePlayer(playerDivRef.current, {
                width: '0',
                height: '0',
                playerVars: {
                    autoplay: 1, // Set autoplay to 1
                    controls: 0,
                },
            });
            playerRef.current = player;

            player.on('stateChange', (event) => {
                if (event.data === 1) { // Playing
                    setIsPlaying(true);
                    player.getDuration().then(setDuration);
                } else { // Paused, ended, etc.
                    setIsPlaying(false);
                }
            });
        }

        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            // The player might be destroyed by other effects, so we don't destroy it here
            // to avoid errors if the component re-renders quickly.
        };
    }, []);
    
     // Progress bar updater
    useEffect(() => {
        if (isPlaying) {
            progressIntervalRef.current = setInterval(async () => {
                if (playerRef.current) {
                    const cTime = await playerRef.current.getCurrentTime();
                    const dur = await playerRef.current.getDuration();
                    setCurrentTime(cTime);
                    setDuration(dur);
                    setProgress(dur > 0 ? (cTime / dur) * 100 : 0);
                }
            }, 1000);
        } else {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        }
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [isPlaying]);

    const handleSelectTrack = (track: YouTubeSearchResult) => {
        setCurrentTrack(track);
        // Using cueVideoById is sometimes more reliable for autoplay
        playerRef.current?.cueVideoById(track.id.videoId);
        playerRef.current?.playVideo();
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            playerRef.current?.pauseVideo();
        } else {
            playerRef.current?.playVideo();
        }
    };
    
    const handleSeek = (value: number[]) => {
        if (duration > 0) {
            const newTime = (value[0] / 100) * duration;
            playerRef.current?.seekTo(newTime, true);
            setProgress(value[0]);
        }
    };

    const handleSearch = () => {
        search(searchTerm);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const LoadingSkeleton = () => (
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="w-12 h-12" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div id="youtube-player-container" ref={playerDivRef} style={{ position: 'absolute', top: -9999, left: -9999 }}></div>
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search for songs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button type="button" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
            </div>

            {currentTrack && (
                <div className="p-3 space-y-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                        <Image src={currentTrack.snippet.thumbnails.default.url} alt={currentTrack.snippet.title} width={56} height={56} className="rounded-md" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate text-primary">{currentTrack.snippet.title}</p>
                            <p className="text-sm truncate text-muted-foreground">{currentTrack.snippet.channelTitle}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
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
                {isLoading ? <LoadingSkeleton /> : error ? <p className="text-center text-destructive">{error}</p> :
                 results.length > 0 ? results.map((track) => (
                    <div key={track.id.videoId} className="flex items-center gap-4 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent" onClick={() => handleSelectTrack(track)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSelectTrack(track)}>
                        <Image src={track.snippet.thumbnails.default.url} alt={track.snippet.title} width={48} height={48} className="object-cover rounded-md" />
                        <div className="flex-1 truncate">
                            <p className="font-semibold truncate">{track.snippet.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{track.snippet.channelTitle}</p>
                        </div>
                    </div>
                )) : <p className="py-8 text-center text-muted-foreground">Search for tracks to get started.</p>
                }
            </div>
        </div>
    );
}
