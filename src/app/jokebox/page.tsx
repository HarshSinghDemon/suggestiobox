
'use client';

import { Suspense, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Radio } from 'lucide-react';
import { RequestForm, type SearchResult } from '@/components/jokebox/request-form';
import { RequestsList } from '@/components/jokebox/requests-list';
import { JokeboxPlayer } from '@/components/jokebox/jokebox-player';
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc, setDoc, addDoc } from 'firebase/firestore';
import type { MusicRequest, Jukebox } from '@/lib/types';
import { JokeboxChat } from '@/components/jokebox/jokebox-chat';
import { useToast } from '@/hooks/use-toast';

const JokeboxPageContent = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Subscribe to the shared jukebox state
    const jukeboxStateRef = useMemoFirebase(() => firestore ? doc(firestore, 'jukebox', 'now-playing') : null, [firestore]);
    const { data: jukeboxState, isLoading: isLoadingJukebox } = useDoc<Jukebox>(jukeboxStateRef);

    // Subscribe to the song request queue
    const requestsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'musicRequests'), orderBy('createdAt', 'asc'), limit(50)) : null),
        [firestore]
    );
    const { data: requests, isLoading: isLoadingRequests } = useCollection<MusicRequest>(requestsQuery);

    const isLoading = isLoadingJukebox || isLoadingRequests;
    
    // A song is considered "in progress" if there's a current song object in the state
    const isSongInProgress = !!jukeboxState?.currentSong;


    const handlePlayNow = async (searchResult: SearchResult) => {
        if (!user || !firestore) return;
        
        const newSong: MusicRequest = {
            id: searchResult.id.videoId,
            videoId: searchResult.id.videoId,
            title: searchResult.snippet.title,
            thumbnail: searchResult.snippet.thumbnails.default.url,
            userName: user?.displayName || 'You',
            userId: user?.uid || 'anonymous',
            songName: searchResult.snippet.title,
            // Firestore timestamps are handled server-side, so use a local date for sorting if needed, but rely on serverTimestamp()
            createdAt: new Date() as any,
        };

        await setDoc(jukeboxStateRef!, {
            currentSong: newSong,
            isPlaying: true,
            timestamp: serverTimestamp(),
            requesterId: user.uid,
        });

        toast({ title: 'Playing Now', description: newSong.title });
    };

    const handleAddToQueue = async (video: SearchResult) => {
        if (!user || !firestore) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to request a song.' });
          return;
        }

        const userName = user.displayName || 'Anonymous';
        const newRequest = {
          userId: user.uid,
          userName: userName,
          songName: video.snippet.title,
          videoId: video.id.videoId,
          thumbnail: video.snippet.thumbnails.default.url,
          title: video.snippet.title,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'musicRequests'), newRequest);
        
        await addDoc(collection(firestore, 'jukeboxMessages'), {
          userId: 'system',
          userName: 'Jokebox Bot',
          text: `${userName} requested "${video.snippet.title}"`,
          isSystemMessage: true,
          createdAt: serverTimestamp(),
        });
  
        toast({ title: 'Song Requested!', description: `${video.snippet.title} has been added to the queue.` });
    };

    const upNext = useMemo(() => {
        if (!requests) return [];
        return requests;
    }, [requests]);


    const handleSongEnd = async () => {
        if (!firestore) return;

        // Check if the song that just ended was from the queue
        const endedSong = jukeboxState?.currentSong;
        
        // Find the next song in the queue
        const nextSong = requests?.[0];
        
        if (nextSong) {
            // Play the next song
            await setDoc(jukeboxStateRef!, {
                currentSong: nextSong,
                isPlaying: true,
                timestamp: serverTimestamp(),
                requesterId: nextSong.userId,
            });
            // Delete the song that just started playing from the queue
            const songRef = doc(firestore, 'musicRequests', nextSong.id);
            await deleteDocumentNonBlocking(songRef);
        } else {
             // If there's no next song, clear the player
            await setDoc(jukeboxStateRef!, {
                currentSong: null,
                isPlaying: false,
                timestamp: serverTimestamp(),
                requesterId: null,
            });
        }
        
        // Check if the song that ended was in the queue and delete it, if it wasn't the one we just promoted
        if (endedSong && endedSong.id !== nextSong?.id) {
            const endedSongInQueue = requests?.find(req => req.id === endedSong.id);
            if (endedSongInQueue) {
                const songRef = doc(firestore, 'musicRequests', endedSongInQueue.id);
                await deleteDocumentNonBlocking(songRef);
            }
        }
    };
    
    const handleNextSong = async () => {
        toast({
            title: 'Skipped!',
            description: `Skipping to the next song.`,
        });
        await handleSongEnd();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Now Playing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <JokeboxPlayer 
                            jukeboxState={jukeboxState}
                            onSongEnd={handleSongEnd}
                            onNextSong={handleNextSong}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Request a Song</CardTitle>
                        <CardDescription>Search for a song on YouTube to play it directly or add it to the queue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RequestForm 
                            onPlaySong={handlePlayNow} 
                            onAddToQueue={handleAddToQueue} 
                            isSongPlaying={isSongInProgress} 
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Up Next</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RequestsList requests={upNext} isLoading={isLoading} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Jokebox Chat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <JokeboxChat />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default function JokeboxPage() {
    const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    return (
        <AuthWrapper>
            <div className="container py-12 mx-auto">
                <div className="flex items-center justify-center mb-8 text-center">
                    <Radio className="w-16 h-16 mr-4 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold">Community Jokebox</h1>
                        <p className="text-lg text-muted-foreground">Listen to music together with the community.</p>
                    </div>
                </div>

                {!youtubeApiKey ? (
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertTitle>Configuration Error</AlertTitle>
                        <AlertDescription>
                            YouTube API Key is not configured. The Jokebox feature will not work.
                            Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your .env file.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
                        <JokeboxPageContent />
                    </Suspense>
                )}
            </div>
        </AuthWrapper>
    );
}

