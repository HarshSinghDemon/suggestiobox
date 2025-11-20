
'use client';

import React, { useRef, useEffect } from 'react';
import YouTubePlayer from 'youtube-player';
import type { MusicRequest } from '@/lib/types';
import { Radio } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type PlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

interface JokeboxPlayerProps {
    song?: MusicRequest | null;
    onSongEnd: () => void;
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

export function JokeboxPlayer({ song, onSongEnd, onPlayerStateChange, autoPlay }: JokeboxPlayerProps) {
    const playerRef = useRef<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const currentVideoIdRef = useRef<string | null>(null);
    const isQueueSongRef = useRef(autoPlay);
    const firestore = useFirestore();
    const { toast } = useToast();

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
                
                if (isQueueSongRef.current && firestore && song?.id && song.videoId) {
                     try {
                        // The ID of a musicRequest from the queue is its firestore doc ID.
                        // A manually played song's ID is its videoId. They won't match.
                        const songRef = doc(firestore, 'musicRequests', song.id);
                        await deleteDoc(songRef);
                        toast({
                            title: 'Song Finished',
                            description: `${song.title} has been removed from the queue.`,
                        });
                    } catch (error) {
                        // This might fail if it's not a queue song, which is okay.
                        console.log('Could not remove song from queue (it may not have been a queue song):', error);
                    }
                }
            }
        };

        if (!playerRef.current) {
            player = YouTubePlayer(playerContainerRef.current, {
                playerVars: {
                    autoplay: 0, // We control autoplay manually
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
                player.playVideo();
                currentVideoIdRef.current = song.videoId;
            }
        } else {
            player.stopVideo();
            currentVideoIdRef.current = null;
        }
    }, [song, onSongEnd, firestore, toast, onPlayerStateChange, autoPlay]);

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
            <div>
                <h3 className="text-xl font-bold">{song.title}</h3>
                <p className="text-sm text-muted-foreground">Requested by {song.userName}</p>
            </div>
        </div>
    );
}
