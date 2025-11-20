
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Play, Pause } from 'lucide-react';
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
            high: { url: string };
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
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { results, isLoading, search } = useYouTubeSearch(apiKey);

    useEffect(() => {
        // Create audio element on mount
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration);
            setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handleSelectTrack = (track: YouTubeSearchResult) => {
        setCurrentTrack(track);
        if (audioRef.current) {
            // Set the source to our backend endpoint
            audioRef.current.src = `/api/audio?id=${track.id.videoId}`;
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (audioRef.current.src) {
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            } else if (results.length > 0) {
                handleSelectTrack(results[0]); // Play first track if none is selected
            }
        }
    };
    
    const handleSeek = (value: number[]) => {
        if (audioRef.current && duration > 0) {
            const newTime = (value[0] / 100) * duration;
            audioRef.current.currentTime = newTime;
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

            {currentTrack && (
                <div className="p-4 space-y-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-4">
                        <Image src={currentTrack.snippet.thumbnails.medium.url} alt={currentTrack.snippet.title} width={64} height={64} className="rounded-md" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate text-primary">{currentTrack.snippet.title}</p>
                            <p className="text-sm truncate text-muted-foreground">{currentTrack.snippet.channelTitle}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handlePlayPause} className="w-12 h-12 rounded-full">
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
                    <p className="py-8 text-center text-muted-foreground">Search for tracks to get started.</p>
                 )
                }
            </div>
        </div>
    );
}
