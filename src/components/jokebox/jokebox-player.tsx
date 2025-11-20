
'use client';

import React, { useRef, useEffect } from 'react';
import YouTubePlayer from 'youtube-player';
import type { MusicRequest, FirebaseUser } from '@/lib/types';
import { Radio, SkipForward } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';

type PlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

interface JokeboxPlayerProps {
    song?: MusicRequest | null;
    onSongEnd: () => void;
    onNextSong: () => void;
    onPlayerStateChange: (state: PlayerState) => void;
    autoPlay: boolean;
}

const playerStateMap: Record<number, PlayerState> = {
    [-1]: 'unstarted',
    [0]: 'ended',
    [1]: 'playing',
    [2]: 'paused',
    [3]: 'buffering',
    [5]: 'cued',
};

export function JokeboxPlayer({ song, onSongEnd, onNextSong, onPlayerStateChange, autoPlay }: JokeboxPlayerProps) {
    const playerRef = useRef<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const currentVideoIdRef = useRef<string | null>(null);
    const isQueueSongRef = useRef(autoPlay);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userData } = useDoc<FirebaseUser>(userDocRef);
    const isAdmin = userData?.role === 'admin';

    const canSkip = song && user && (isAdmin || user.uid === song.userId);

    useEffect(() => {
        isQueueSongRef.current = autoPlay;
    }, [autoPlay]);

    useEffect(() => {
        if (!playerContainerRef.current) return;

        let player: any;

        const onPlayerReady = (event: any) => {
            if (song?.videoId && autoPlay) {
                event.target.playVideo();
            }
        };

        const onPlayerStateChangeCallback = async (event: any) => {
            const state = playerStateMap[event.data];
            if (state) {
                onPlayerStateChange(state);
            }

            if (event.data === 0) { // Video ended
                onSongEnd();
            }
        };

        if (!playerRef.current) {
            player = YouTubePlayer(playerContainerRef.current, {
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
            });
            playerRef.current = player;
            player.on('ready', onPlayerReady);
            player.on('stateChange', onPlayerStateChangeCallback);
        } else {
            player = playerRef.current;
        }
        
        if (song) {
            if (currentVideoIdRef.current !== song.videoId) {
                player.loadVideoById(song.videoId);
                currentVideoIdRef.current = song.videoId;
            }
             player.playVideo();
        } else {
            player.stopVideo();
            currentVideoIdRef.current = null;
        }
    }, [song, onSongEnd, onPlayerStateChange, autoPlay]);

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
