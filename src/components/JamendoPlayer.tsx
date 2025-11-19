'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Music, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const JAMENDO_CLIENT_ID = '3d159494';
const JAMENDO_API_URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=20&audioformat=mp31&include=musicinfo&boost=popularity_month`;

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
}

export function JamendoPlayer() {
  const [playlist, setPlaylist] = useState<JamendoTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isFirstPlay = useRef(true);

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(JAMENDO_API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch songs from Jamendo.');
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const validTracks = data.results.filter((track: JamendoTrack) => track.audio);
          if (validTracks.length === 0) {
            throw new Error('No playable tracks found in the API response.');
          }
          setPlaylist(validTracks);
        } else {
          throw new Error('No songs found.');
        }
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);
  
  const currentTrack = playlist[currentTrackIndex];
  
  useEffect(() => {
    if (audioRef.current && currentTrack) {
        if (audioRef.current.src !== currentTrack.audio) {
            audioRef.current.src = currentTrack.audio;
        }
        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.error("Autoplay failed:", e);
                setIsPlaying(false);
            });
        }
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);


  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isFirstPlay.current) {
      isFirstPlay.current = false;
      audioRef.current.src = currentTrack.audio;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack]);

  const playNext = useCallback(() => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  }, [playlist.length]);

  const playPrevious = useCallback(() => {
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted) setIsMuted(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-foreground">
        <Loader2 className="w-12 h-12 mb-4 animate-spin" />
        <p className="text-lg">Loading your music...</p>
        <p className="text-sm text-muted-foreground">Fetching fresh tracks from Jamendo.</p>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-destructive">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <p className="text-lg font-semibold">Could not load music</p>
            <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-2xl bg-gradient-to-br from-card to-muted/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-48 h-48 rounded-lg shadow-lg">
            {currentTrack?.album_image ? (
              <Image
                src={currentTrack.album_image}
                alt={currentTrack.name}
                fill
                className="object-cover rounded-md"
                unoptimized
              />
            ) : (
               <div className="flex items-center justify-center w-full h-full rounded-md bg-muted">
                    <Music className="w-16 h-16 text-muted-foreground" />
                </div>
            )}
            <div className="absolute inset-0 bg-black/20 rounded-md"></div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold truncate text-foreground">{currentTrack?.name || 'Unknown Song'}</h2>
            <p className="text-sm text-muted-foreground">{currentTrack?.artist_name || 'Unknown Artist'}</p>
          </div>
          
          <div className="flex items-center justify-center w-full gap-4">
            <Button variant="ghost" size="icon" onClick={playPrevious}>
              <SkipBack className="w-6 h-6" />
            </Button>
            <Button variant="default" size="icon" className="w-16 h-16 rounded-full shadow-lg" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext}>
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center w-full gap-3 pt-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      </CardContent>
      <audio
        ref={audioRef}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />
    </Card>
  );
}
