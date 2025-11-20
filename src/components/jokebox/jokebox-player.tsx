
'use client';

import React, { useRef, useEffect, useState } from 'react';
import YouTubePlayer from 'youtube-player';
import type { Jukebox, FirebaseUser } from '@/lib/types';
import { Radio, SkipForward } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '../ui/button';

interface JokeboxPlayerProps {
    jukeboxState?: Jukebox | null;
    onSongEnd: () => void;
    onNextSong: () => void;
}

export function JokeboxPlayer({ jukeboxState, onSongEnd, onNextSong }: JokeboxPlayerProps) {
    const playerRef = useRef<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const firestore = useFirestore();

    const song = jukeboxState?.currentSong;
    const isPlaying = jukeboxState?.isPlaying;
    const timestamp = jukeboxState?.timestamp;
    const requesterId = jukeboxState?.requesterId;
    
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userData } = useDoc<FirebaseUser>(userDocRef);
    const isAdmin = userData?.role === 'admin';

    const canSkip = song && user && (isAdmin || user.uid === requesterId);

    useEffect(() => {
        if (!playerContainerRef.current) return;

        const onPlayerStateChangeCallback = async (event: any) => {
            // state 0 means the video has ended
            if (event.data === 0) { 
                onSongEnd();
            }
        };

        if (!playerRef.current) {
            const player = YouTubePlayer(playerContainerRef.current!, {
                playerVars: {
                    autoplay: 1, // Autoplay when a new video is loaded
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
            });
            playerRef.current = player;
            player.on('stateChange', onPlayerStateChangeCallback);
        }

        const player = playerRef.current;

        const syncPlayer = async () => {
            const videoIdOnPlayer = await player.getVideoData()?.video_id;
            
            if (song?.videoId) {
                if (videoIdOnPlayer !== song.videoId) {
                    player.loadVideoById(song.videoId);
                }

                if (isPlaying) {
                     const serverTime = timestamp?.toDate().getTime() ?? Date.now();
                     // A more robust solution would involve a server-side time sync, but this is good for client-side
                     const clientTime = Date.now();
                     const elapsedTime = (clientTime - serverTime) / 1000;
                     
                     // Only seek if there's a significant difference to avoid jarring jumps
                     const currentTime = await player.getCurrentTime();
                     if (Math.abs(currentTime - elapsedTime) > 5) {
                        player.seekTo(elapsedTime, true);
                     }
                     
                     player.playVideo();
                } else {
                    player.pauseVideo();
                }

            } else {
                player.stopVideo();
            }
        };

        syncPlayer();

    }, [song, isPlaying, timestamp, onSongEnd]);

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
