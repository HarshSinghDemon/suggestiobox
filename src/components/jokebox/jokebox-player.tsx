
'use client';

import React, { useRef, useEffect, useState } from 'react';
import YouTubePlayer, { YouTubePlayer as YouTubePlayerType } from 'youtube-player';
import type { Jukebox, FirebaseUser } from '@/lib/types';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Radio, SkipForward } from 'lucide-react';

interface JokeboxPlayerProps {
    jukeboxState?: Jukebox | null;
    onSongEnd: () => void;
    onNextSong: () => void;
}

export function JokeboxPlayer({ jukeboxState, onSongEnd, onNextSong }: JokeboxPlayerProps) {
    const playerRef = useRef<YouTubePlayerType | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const firestore = useFirestore();

    const song = jukeboxState?.currentSong;
    const isPlaying = jukeboxState?.isPlaying;
    const requesterId = jukeboxState?.requesterId;
    
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userData } = useDoc<FirebaseUser>(userDocRef);
    const isAdmin = userData?.role === 'admin';

    const canSkip = song && user && (isAdmin || user.uid === requesterId);

    useEffect(() => {
        if (playerContainerRef.current && song?.videoId) {
            // Destroy previous instance if it exists
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            const player = YouTubePlayer(playerContainerRef.current, {
                videoId: song.videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
            });

            playerRef.current = player;

            player.on('stateChange', (event) => {
                if (event.data === 0) { // 0 = 'ended'
                    onSongEnd();
                }
            });
            
            player.on('ready', () => {
              if (isPlaying) {
                player.playVideo();
              }
            });

        } else if (!song && playerRef.current) {
            // If no song, destroy the player
            playerRef.current.destroy();
            playerRef.current = null;
        }

        // Cleanup on component unmount
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [song?.videoId]); // Re-run effect only when the song video ID changes

    if (!song) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted rounded-lg aspect-video">
                <Radio className="w-16 h-16 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Jokebox is quiet...</h3>
                <p className="text-sm text-muted-foreground">Search for a song to play it directly or add it to the queue!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-lg aspect-video bg-black">
                <div ref={playerContainerRef} className='w-full h-full' />
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">{song.title}</h3>
                    <p className="text-sm text-muted-foreground">Requested by {song.userName}</p>
                </div>
                 {canSkip && (
                    <Button onClick={onNextSong} variant="outline" size="sm">
                        <SkipForward className="w-4 h-4 mr-2" />
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}
