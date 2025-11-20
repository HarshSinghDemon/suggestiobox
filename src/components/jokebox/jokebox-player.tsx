
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Play, Pause, Music, Volume2, VolumeX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';

interface Track {
    id: string;
    name: string;
    artist_name: string;
    album_image: string;
    audio: string;
}

interface JokeboxPlayerProps {
    clientId: string;
}

function TrackSkeleton() {
    return (
        <div className="flex items-center gap-4 p-2">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
        </div>
    );
}

export function JokeboxPlayer({ clientId }: JokeboxPlayerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const searchTracks = useCallback(async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        try {
            const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            if (data.results) {
                setTracks(data.results);
            }
        } catch (error) {
            console.error("Failed to fetch tracks:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, clientId]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const handlePlayPause = (track: Track) => {
        if (currentTrack?.id === track.id) {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                audioRef.current?.play();
                setIsPlaying(true);
            }
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
        }
    };
    
    useEffect(() => {
        if (currentTrack && audioRef.current) {
            audioRef.current.src = currentTrack.audio;
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
    }, [currentTrack]);
    

    return (
        <div className="space-y-6">
            <div className="flex w-full max-w-sm mx-auto items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search for a track..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchTracks()}
                />
                <Button type="button" onClick={searchTracks} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
            </div>

            <div className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TrackSkeleton key={i} />)
                ) : tracks.length > 0 ? (
                    tracks.map((track) => (
                        <div key={track.id} className={cn("flex items-center gap-4 p-2 rounded-md transition-colors", currentTrack?.id === track.id ? 'bg-primary/10' : 'hover:bg-accent')}>
                            <Image
                                src={track.album_image || '/icons/icon-192x192.png'}
                                alt={track.name}
                                width={64}
                                height={64}
                                className="object-cover rounded-md w-16 h-16"
                            />
                            <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{track.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handlePlayPause(track)}>
                                {currentTrack?.id === track.id && isPlaying ? <Pause /> : <Play />}
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <Music className="w-12 h-12 mx-auto mb-2" />
                        <p>No tracks found. Try searching for something!</p>
                    </div>
                )}
            </div>
            
            {currentTrack && (
                 <div className="sticky bottom-4 inset-x-0 mx-auto w-full max-w-xl">
                    <div className="flex items-center gap-4 p-3 rounded-lg shadow-lg bg-card border animate-fade-in-up">
                        <Image
                            src={currentTrack.album_image || '/icons/icon-192x192.png'}
                            alt={currentTrack.name}
                            width={56}
                            height={56}
                            className="object-cover rounded-md w-14 h-14"
                        />
                        <div className="flex-1 truncate">
                            <p className="font-semibold truncate">{currentTrack.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{currentTrack.artist_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" onClick={() => handlePlayPause(currentTrack)}>
                                {isPlaying ? <Pause /> : <Play />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                                {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                            </Button>
                             <Slider
                                defaultValue={[volume]}
                                max={1}
                                step={0.01}
                                className="w-24"
                                onValueChange={(value) => setVolume(value[0])}
                            />
                        </div>
                    </div>
                 </div>
            )}
            
            <audio
                ref={audioRef}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />
        </div>
    );
}
