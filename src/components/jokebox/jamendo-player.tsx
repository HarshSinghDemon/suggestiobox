
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, PlayCircle, PauseCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Define the structure of a Jamendo track
interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    image: string;
    audio: string;
    audiodownload: string;
    duration: number;
}

// Hook for handling Jamendo API search logic
const useJamendoSearch = (clientId: string) => {    
    const [results, setResults] = useState<JamendoTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const search = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&namesearch=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.results.length === 0) {
                toast({
                    variant: 'default',
                    title: 'No Results',
                    description: `No tracks found for "${query}".`,
                });
            }
            setResults(data.results);
        } catch (err: any) {
            setError('Failed to fetch music. Please try again later.');
            toast({
                variant: 'destructive',
                title: 'API Error',
                description: err.message || 'An unknown error occurred.',
            });
            console.error("Jamendo search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [clientId, toast]);
    
    return { results, isLoading, error, search };
};


// Main Player Component
export function JamendoPlayer({ clientId }: { clientId: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const { results, isLoading, error, search } = useJamendoSearch(clientId);

    // Effect to control audio playback
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        if (isPlaying) {
            audio.play().catch(e => console.error("Playback error:", e));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Effect to set up audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Function to handle selecting a track
    const handleSelectTrack = (track: JamendoTrack) => {
        // The API provides both 'audio' (stream) and 'audiodownload' (download) links.
        // We prioritize 'audio' but fallback to 'audiodownload' if necessary.
        const audioUrl = track.audio || track.audiodownload;
        if (!audioUrl) {
            alert('This track is not available for streaming.');
            return;
        }
        
        if (currentTrack?.id === track.id) {
            // If the same track is clicked, toggle play/pause
            setIsPlaying(!isPlaying);
        } else {
            // If a new track is selected
            setCurrentTrack(track);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();
                audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Playback error on new track:", e));
            }
        }
    };
    
    // Utility to format time from seconds to MM:SS
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };


    return (
        <div className="space-y-6">
            {/* Search Input and Button */}
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search for an artist or track..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search(searchTerm)}
                />
                <Button type="button" onClick={() => search(searchTerm)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
            </div>

            {/* Audio Element (hidden) */}
            <audio ref={audioRef} />

            {/* Current Track Display */}
            {currentTrack && (
                <div className="p-3 space-y-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                         <Image
                            src={currentTrack.image.replace('width=200', 'width=56')}
                            alt={currentTrack.name}
                            width={56}
                            height={56}
                            className="rounded-md"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate text-primary">{currentTrack.name}</p>
                            <p className="text-sm truncate text-muted-foreground">{currentTrack.artist_name}</p>
                        </div>
                         <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                        <Progress value={progress} className="w-full h-2"/>
                        <span className="text-xs font-mono">{formatTime(currentTrack.duration)}</span>
                    </div>
                </div>
            )}

            {/* Search Results */}
            <div className="space-y-2">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2"><Skeleton className="w-12 h-12" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                    ))
                ) : results.length > 0 ? (
                    results.map((track) => (
                        <div 
                            key={track.id} 
                            className="flex items-center gap-4 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent"
                            onClick={() => handleSelectTrack(track)}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleSelectTrack(track)}
                        >
                            <Image
                                src={track.image.replace('width=200', 'width=48')}
                                alt={track.name}
                                width={48}
                                height={48}
                                className="object-cover rounded-md"
                            />
                            <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{track.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                            </div>
                            <span className="text-sm font-mono text-muted-foreground">{formatTime(track.duration)}</span>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        <p>Search for music to get started.</p>
                    </div>
                )}
                 {error && <p className="text-center text-destructive">{error}</p>}
            </div>
        </div>
    );
}
