
'use client';

import React, { useRef, useEffect, useState } from 'react';
import YouTubePlayer from 'youtube-player';
import type { MusicRequest } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Music, Radio } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface JokeboxPlayerProps {
    song?: MusicRequest;
}

export function JokeboxPlayer({ song }: JokeboxPlayerProps) {
    const playerRef = useRef<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const firestore = useFirestore();
    const { user } = useUser();

    useEffect(() => {
        if (!song || !playerContainerRef.current) return;

        const container = playerContainerRef.current;

        const onReady = (event: any) => {
            event.target.playVideo();
        };

        const onStateChange = (event: any) => {
            if (event.data === 0 && firestore && user) { // 0 = ended
                const songRef = doc(firestore, 'musicRequests', song.id);
                deleteDoc(songRef);
            }
        };

        playerRef.current = YouTubePlayer(container, {
            videoId: song.videoId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0,
            },
        });

        playerRef.current.on('ready', onReady);
        playerRef.current.on('stateChange', onStateChange);

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [song, firestore, user]);

    if (!song) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted rounded-lg aspect-video">
                <Radio className="w-16 h-16 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Jokebox is quiet...</h3>
                <p className="text-sm text-muted-foreground">Request a song to get the party started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-lg aspect-video bg-black">
                <div ref={playerContainerRef} className='w-full h-full' />
            </div>
            <div>
                <h3 className="text-xl font-bold">{song.title}</h3>
                <p className="text-sm text-muted-foreground">Requested by {song.userName}</p>
            </div>
        </div>
    );
}
