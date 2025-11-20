
'use client';

import React, { useRef, useEffect } from 'react';
import YouTubePlayer from 'youtube-player';
import type { MusicRequest } from '@/lib/types';
import { Radio } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface JokeboxPlayerProps {
    song?: MusicRequest;
    onSongEnd: () => void;
    isQueueSong: boolean;
}

export function JokeboxPlayer({ song, onSongEnd, isQueueSong }: JokeboxPlayerProps) {
    const playerRef = useRef<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (!playerContainerRef.current) return;
    
        const container = playerContainerRef.current;
        let player: any;
    
        // Define handlers inside useEffect
        const onPlayerReady = (event: any) => {
          if (song?.videoId) {
            event.target.loadVideoById(song.videoId);
            event.target.playVideo();
          }
        };
    
        const onPlayerStateChange = async (event: any) => {
          if (event.data === 0) { // Video ended
            onSongEnd();
    
            if (isQueueSong && firestore && song?.id) {
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
    
        // Initialize player
        if (!playerRef.current) {
          player = YouTubePlayer(container, {
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
            },
          });
          playerRef.current = player;
          player.on('ready', onPlayerReady);
          player.on('stateChange', onPlayerStateChange);
        } else {
          // If player exists, just load the new video if it's different
          player = playerRef.current;
          if (song) {
            player.getVideoData().then((data: {video_id: string}) => {
              if (data.video_id !== song.videoId) {
                player.loadVideoById(song.videoId);
              }
            });
          } else {
            player.stopVideo();
          }
        }
    
        return () => {
          // Cleanup listeners if the component unmounts or dependencies change
          if (player && typeof player.off === 'function') {
            player.off('ready', onPlayerReady);
            player.off('stateChange', onPlayerStateChange);
          }
        };
      }, [song, firestore, toast, isQueueSong, onSongEnd]);

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
