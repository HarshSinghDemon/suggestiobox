
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
    Loader2 
} from 'lucide-react';

// API Key provided by the user
const API_KEY = "AIzaSyDGHJKP0d5ge1eQR5Kzszg8oS_lChoYut8";

// --- Types ---
interface YouTubeTrack {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration?: number; // Duration in seconds
}

interface YouTubeSearchResult {
    id: { videoId: string };
    snippet: {
        title:string;
        channelTitle: string;
        thumbnails: { medium: { url: string }};
    };
}

// --- Main Component ---
export function YoutubePlayer() {
    const { toast } = useToast();

    // Search State
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);

    // Player State
    const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Playlist State
    const [playlist, setPlaylist] = useState<YouTubeTrack[]>([]);
    const [showPlaylist, setShowPlaylist] = useState(true);
    
    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // --- Core Functions ---

    /**
     * Searches for songs on YouTube using the Data API.
     */
    const searchSongs = useCallback(async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setSearchResults([]);

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=20&videoCategoryId=10&key=${API_KEY}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || "API request failed. Check quota.");
            }
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                toast({ title: 'No songs found', description: `Your search for "${query}" returned no results.` });
                return;
            }

            const tracks: YouTubeTrack[] = data.items.map((item: YouTubeSearchResult) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.medium.url,
            }));
            setSearchResults(tracks);
        } catch (error: any) {
            console.error("YouTube Search Error:", error);
            toast({ variant: 'destructive', title: 'Search Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [query, toast]);

    /**
     * Loads and plays a song using its video ID in the hidden iframe.
     * @param videoId The YouTube video ID.
     * @param title The song title.
     * @param channel The artist/channel name.
     */
    const playSong = useCallback((track: YouTubeTrack) => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        
        const embedUrl = `https://www.youtube.com/embed/${track.id}?autoplay=1&controls=0&playsinline=1&modestbranding=1`;
        if (iframeRef.current) {
            iframeRef.current.src = embedUrl;
        }

        setCurrentTrack(track);
        setIsPlaying(true);
        setProgress(0);
        
        // Since we can't get real duration, we simulate it for the progress bar.
        // We will fetch it later if possible, but for now, assume 3 minutes.
        const estimatedDuration = 180;
        setDuration(estimatedDuration);
        
        // Simulate progress bar update
        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    playNext();
                    return 0;
                }
                return prev + (100 / estimatedDuration);
            });
        }, 1000);
    }, []);

    const togglePause = () => {
        // This is a simulated pause. We reload the iframe to stop it.
        if (isPlaying && iframeRef.current) {
            iframeRef.current.src = 'about:blank';
            if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setIsPlaying(false);
        } else if (!isPlaying && currentTrack) {
            playSong(currentTrack);
        }
    };

    const toggleMute = () => {
        // This is a simulated mute.
        setIsMuted(!isMuted);
    };

    // --- Playlist Functions ---

    const loadPlaylist = useCallback(() => {
        try {
            const savedPlaylist = localStorage.getItem('ytAudioPlaylist');
            if (savedPlaylist) {
                setPlaylist(JSON.parse(savedPlaylist));
            }
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

    // --- UI Components ---

    const SearchResults = () => (
        <div className="space-y-2">
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-full h-16 rounded-md" />)
            ) : searchResults.length > 0 ? (
                searchResults.map(track => (
                    <div key={track.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                        <Image src={track.thumbnail} alt={track.title} width={48} height={48} className="object-cover rounded" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{track.title}</p>
                            <p className="text-sm truncate text-muted-foreground">{track.channel}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => addToPlaylist(track)}><Plus className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => playSong(track)}><Play className="w-4 h-4" /></Button>
                    </div>
                ))
            ) : (
                <p className="py-8 text-center text-muted-foreground">Search for music to begin.</p>
            )}
        </div>
    );
    
    const Playlist = () => (
        <div className={cn("p-4 space-y-2 border-l bg-background/50", showPlaylist ? 'block' : 'hidden')}>
            <h3 className="text-lg font-semibold">Playlist</h3>
            <div className="space-y-2 overflow-y-auto max-h-96">
                {playlist.length > 0 ? (
                    playlist.map(track => (
                        <div key={track.id} className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent", currentTrack?.id === track.id && "bg-accent")}>
                            <div className="flex-1 min-w-0" onClick={() => playSong(track)}>
                                <p className="text-sm font-semibold truncate">{track.title}</p>
                                <p className="text-xs truncate text-muted-foreground">{track.channel}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => removeFromPlaylist(track.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-center text-muted-foreground">Your playlist is empty.</p>
                )}
            </div>
        </div>
    );

    // --- Render ---
    return (
        <div className="flex flex-col h-[calc(100vh-10rem)]">
            {/* Hidden Iframe for Audio Playback */}
            <iframe
                ref={iframeRef}
                id="yt-audio"
                allow="autoplay"
                style={{ width: '1px', height: '1px', opacity: 0, position: 'absolute', top: '-100px' }}
                onError={() => toast({ variant: 'destructive', title: 'Playback Error', description: 'Failed to load video.'})}
            ></iframe>
            
            {/* Main Content */}
            <div className="flex-1 min-h-0 md:grid md:grid-cols-3">
                <div className="p-4 md:col-span-2">
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Search songs on YouTube..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchSongs()}
                        />
                        <Button onClick={searchSongs} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-4rem)]">
                        <SearchResults />
                    </div>
                </div>
                <div className="hidden md:block">
                  <Playlist />
                </div>
            </div>

            {/* Player Controls */}
            <div className="p-4 border-t bg-background">
                <div className="flex items-center gap-4">
                    {currentTrack ? (
                        <Image src={currentTrack.thumbnail} alt={currentTrack.title} width={56} height={56} className="rounded" />
                    ) : (
                        <div className="flex items-center justify-center w-14 h-14 bg-muted rounded"><ListMusic /></div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{currentTrack?.title || 'No song selected'}</p>
                        <p className="text-sm truncate text-muted-foreground">{currentTrack?.channel || '---'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={playPrevious} disabled={!currentTrack}><SkipBack /></Button>
                        <Button variant="default" size="icon" className="w-12 h-12 rounded-full" onClick={togglePause} disabled={!currentTrack}>
                            {isPlaying ? <Pause /> : <Play className="pl-1" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentTrack}><SkipForward /></Button>
                    </div>
                    <div className="items-center hidden gap-2 md:flex">
                        <Button variant="ghost" size="icon" onClick={toggleMute}>
                            {isMuted ? <VolumeX /> : <Volume2 />}
                        </Button>
                        <Slider
                            defaultValue={[1]}
                            max={1}
                            step={0.1}
                            className="w-24"
                            onValueChange={(value) => { /* Simulated volume */ }}
                            disabled
                        />
                    </div>
                </div>
                 {currentTrack && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-muted-foreground">{formatTime(progress / 100 * duration)}</span>
                        <Slider
                            value={[progress]}
                            max={100}
                            step={1}
                            className="w-full"
                        />
                        <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
