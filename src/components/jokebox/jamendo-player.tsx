
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, PlayCircle, PauseCircle, Music, Users, Link as LinkIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// #### Data Structures ####
interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    image: string;
    audio: string;
    audiodownload: string;
    duration: number;
}

interface JamendoArtist {
    id: string;
    name: string;
    image: string;
    website: string;
    joindate: string;
    stats: {
        musicinfo_count: number;
    };
}

type SearchType = 'tracks' | 'artists';

// #### Custom Hook for Jamendo API ####
const useJamendoSearch = (clientId: string) => {
    const [trackResults, setTrackResults] = useState<JamendoTrack[]>([]);
    const [artistResults, setArtistResults] = useState<JamendoArtist[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const search = useCallback(async (query: string, type: SearchType) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setTrackResults([]);
        setArtistResults([]);

        const endpoint = type === 'tracks' ? 'tracks' : 'artists';
        const url = `https://api.jamendo.com/v3.0/${endpoint}/?client_id=${clientId}&format=json&limit=20&namesearch=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response failed.');

            const data = await response.json();
            if (data.results.length === 0) {
                toast({ title: 'No Results', description: `No ${type} found for "${query}".` });
            }

            if (type === 'tracks') {
                setTrackResults(data.results);
            } else {
                setArtistResults(data.results);
            }

        } catch (err: any) {
            setError(`Failed to fetch ${type}. Please try again later.`);
            toast({ variant: 'destructive', title: 'API Error', description: err.message || 'An unknown error occurred.' });
            console.error("Jamendo search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [clientId, toast]);

    const searchTracksByArtist = useCallback(async (artistName: string) => {
        setIsLoading(true);
        setError(null);
        setTrackResults([]);
        setArtistResults([]);
        
        const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&artist_name=${encodeURIComponent(artistName)}`;
        try {
             const response = await fetch(url);
            if (!response.ok) throw new Error('Network response failed.');
            const data = await response.json();
            if (data.results.length === 0) {
                 toast({ title: 'No Tracks Found', description: `No tracks found for artist "${artistName}".` });
            }
            setTrackResults(data.results);
        } catch (err: any) {
            setError(`Failed to fetch tracks for ${artistName}.`);
            toast({ variant: 'destructive', title: 'API Error', description: err.message || 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }

    }, [clientId, toast]);
    
    return { trackResults, artistResults, isLoading, error, search, searchTracksByArtist };
};


// #### Main Player Component ####
export function JamendoPlayer({ clientId }: { clientId: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('tracks');
    const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const { trackResults, artistResults, isLoading, error, search, searchTracksByArtist } = useJamendoSearch(clientId);

    // Effect to control audio playback
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.play().catch(e => console.error("Playback error:", e));
        else audio.pause();
    }, [isPlaying]);

    // Effect to set up audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleTimeUpdate = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
            setCurrentTime(audio.currentTime);
        };
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Function to handle selecting a track
    const handleSelectTrack = (track: JamendoTrack) => {
        const audioUrl = track.audio || track.audiodownload;
        if (!audioUrl) {
            alert('This track is not available for streaming.');
            return;
        }
        
        if (currentTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentTrack(track);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();
                audioRef.current.play().then(() => setIsPlaying(true));
            }
        }
    };
    
    // Function to handle clicking an artist
    const handleArtistClick = (artistName: string) => {
        setSearchTerm(artistName);
        setSearchType('tracks');
        searchTracksByArtist(artistName);
    };

    const handleSearch = () => {
        search(searchTerm, searchType);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    // Skeleton component for loading state
    const LoadingSkeleton = () => (
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2"><Skeleton className="w-12 h-12" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as SearchType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tracks"><Music className="w-4 h-4 mr-2"/>Tracks</TabsTrigger>
                    <TabsTrigger value="artists"><Users className="w-4 h-4 mr-2"/>Artists</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder={`Search for ${searchType}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button type="button" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
            </div>

            <audio ref={audioRef} />

            {currentTrack && (
                <div className="p-3 space-y-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                        <Image src={currentTrack.image.replace('width=200', 'width=56')} alt={currentTrack.name} width={56} height={56} className="rounded-md" unoptimized />
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

            <div className="space-y-2">
                {isLoading ? <LoadingSkeleton /> : error ? <p className="text-center text-destructive">{error}</p> : 
                 searchType === 'tracks' ? (
                     trackResults.length > 0 ? trackResults.map((track) => (
                        <div key={track.id} className="flex items-center gap-4 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent" onClick={() => handleSelectTrack(track)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSelectTrack(track)}>
                            <Image src={track.image.replace('width=200', 'width=48')} alt={track.name} width={48} height={48} className="object-cover rounded-md" unoptimized />
                            <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{track.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                            </div>
                            <span className="text-sm font-mono text-muted-foreground">{formatTime(track.duration)}</span>
                        </div>
                    )) : <p className="py-8 text-center text-muted-foreground">Search for tracks to get started.</p>
                 ) : (
                     artistResults.length > 0 ? artistResults.map((artist) => (
                        <div key={artist.id} className="flex items-center gap-4 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent" onClick={() => handleArtistClick(artist.name)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleArtistClick(artist.name)}>
                             <Image src={artist.image.replace('width=200', 'width=48')} alt={artist.name} width={48} height={48} className="object-cover rounded-md" unoptimized />
                             <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{artist.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {artist.stats.musicinfo_count} tracks
                                </p>
                            </div>
                             {artist.website && <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}><a href={artist.website} target="_blank" rel="noopener noreferrer"><LinkIcon className="w-4 h-4"/></a></Button>}
                        </div>
                    )) : <p className="py-8 text-center text-muted-foreground">Search for artists to get started.</p>
                 )
                }
            </div>
        </div>
    );
}
