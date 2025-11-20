
'use client';

import React, { useRef, useEffect, useState } from 'react';
import YouTubePlayer from 'youtube-player';
import type { MusicRequest } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Music, Radio } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface JokeboxPlayerProps {
    song?: MusicRequest;
}

export function JokeboxPlayer({ song }: JokeboxPlayerProps) {
    const playerRef = useRef<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        if (!song || !playerContainerRef.current) {
            // If there's no song, make sure to destroy any existing player instance
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
            return;
        };

        const container = playerContainerRef.current;
        let isPlayerReady = false;

        const onReady = (event: any) => {
            isPlayerReady = true;
            event.target.playVideo();
        };

        const onStateChange = async (event: any) => {
            // When the video ends (state 0), delete it from the queue
            if (event.data === 0) { 
                if (firestore && song?.id) {
                    try {
                        const songRef = doc(firestore, 'musicRequests', song.id);
                        await deleteDoc(songRef);
                        toast({
                            title: 'Song Finished',
                            description: `${song.title} has been removed from the queue.`,
                        });
                    } catch (error) {
                        console.error('Error removing song from queue:', error);
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Could not remove the song from the queue.',
                        });
                    }
                }
            }
        };

        // If a player instance already exists, load the new video. Otherwise, create one.
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById(song.videoId);
        } else {
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
        }


        return () => {
            // Cleanup: remove listeners, but don't destroy the player instance itself
            // as it might be reused. The player is destroyed only when there are no songs.
            if (playerRef.current && typeof playerRef.current.off === 'function') {
                playerRef.current.off('ready', onReady);
                playerRef.current.off('stateChange', onStateChange);
            }
        };
    }, [song, firestore, user, toast]);

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
