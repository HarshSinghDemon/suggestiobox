
'use client';

import { useSpotify } from "@/context/spotify-context";
import Image from "next/image";
import { Music, Play, Pause, SkipBack, SkipForward, Maximize2, X, Volume2, Volume1, VolumeX } from "lucide-react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SiteWidePlayer() {
    const { isLoggedIn, playbackState, player } = useSpotify();
    const [volume, setVolume] = useState(50);
    const router = useRouter();

    useEffect(() => {
        if (player) {
            player.getVolume().then(v => setVolume(v * 100));
        }
    }, [player]);

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        if (player) {
            player.setVolume(newVolume / 100);
            setVolume(newVolume);
        }
    };
    
    const VolumeIcon = () => {
        if (volume === 0) return <VolumeX className="w-5 h-5"/>;
        if (volume < 50) return <Volume1 className="w-5 h-5"/>;
        return <Volume2 className="w-5 h-5"/>
    };

    if (!isLoggedIn || !playbackState) {
        return null;
    }

    const currentTrack = playbackState.track_window.current_track;
    const isPaused = playbackState.paused;
    const albumArtUrl = currentTrack.album.images[0]?.url;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-card border-t border-border/50 animate-in slide-in-from-bottom-full">
            <div className="container flex items-center justify-between h-full">
                <div className="flex items-center gap-4 w-1/4">
                    {albumArtUrl ? (
                        <Image src={albumArtUrl} alt={currentTrack.album.name} width={56} height={56} className="rounded-md" />
                    ) : (
                        <div className="flex items-center justify-center w-14 h-14 bg-muted rounded-md">
                            <Music className="w-8 h-8 text-muted-foreground" />
                        </div>
                    )}
                    <div className="truncate">
                        <p className="font-semibold truncate">{currentTrack.name}</p>
                        <p className="text-sm truncate text-muted-foreground">{currentTrack.artists.map(a => a.name).join(', ')}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 w-1/2">
                     <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => player?.previousTrack()} className="disabled:opacity-50" disabled={!playbackState?.disallows.skipping_prev}>
                            <SkipBack className="w-5 h-5 fill-current" />
                        </Button>
                        <Button size="icon" className="w-10 h-10 rounded-full" onClick={() => player?.togglePlay()}>
                            {isPaused ? <Play className="w-5 h-5 ml-1 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => player?.nextTrack()} className="disabled:opacity-50" disabled={!playbackState?.disallows.skipping_next}>
                            <SkipForward className="w-5 h-5 fill-current" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 w-1/4">
                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                        <VolumeIcon />
                        <Slider 
                            defaultValue={[volume]} 
                            max={100} 
                            step={1} 
                            onValueChange={handleVolumeChange}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => router.push('/spotify-player')}>
                        <Maximize2 className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
