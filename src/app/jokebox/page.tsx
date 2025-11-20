
'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Radio } from 'lucide-react';
import { RequestForm, type SearchResult } from '@/components/jokebox/request-form';
import { RequestsList } from '@/components/jokebox/requests-list';
import { JokeboxPlayer } from '@/components/jokebox/jokebox-player';
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc, setDoc, addDoc, getDoc, writeBatch } from 'firebase/firestore';
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
    const isSongPlaying = !!jukeboxState?.currentSong;


    const handlePlayNow = useCallback(async (searchResult: SearchResult) => {
        if (!user || !firestore || !jukeboxStateRef) return;
        
        const newSong: MusicRequest = {
            id: searchResult.id.videoId, // Use videoId for consistency
            videoId: searchResult.id.videoId,
            title: searchResult.snippet.title,
            thumbnail: searchResult.snippet.thumbnails.default.url,
            userName: user?.displayName || 'You',
            userId: user?.uid || 'anonymous',
            songName: searchResult.snippet.title,
            createdAt: new Date() as any, // This is temporary, serverTimestamp will overwrite
        };

        const batch = writeBatch(firestore);

        batch.set(jukeboxStateRef, {
            currentSong: newSong,
            isPlaying: true,
            timestamp: serverTimestamp(),
            requesterId: user.uid,
        });

         batch.set(doc(collection(firestore, 'jukeboxMessages')), {
            userId: 'system',
            userName: 'Jokebox Bot',
            text: `${user.displayName || 'A user'} is now playing "${newSong.title}"`,
            isSystemMessage: true,
            createdAt: serverTimestamp(),
        });
        
        await batch.commit();
        toast({ title: 'Playing Now', description: newSong.title });

    }, [user, firestore, jukeboxStateRef, toast]);

    const handleAddToQueue = useCallback(async (video: SearchResult) => {
        if (!user || !firestore || !jukeboxStateRef) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to request a song.' });
          return;
        }

        const userName = user.displayName || 'Anonymous';
        const newRequestData = {
          userId: user.uid,
          userName: userName,
          songName: video.snippet.title,
          videoId: video.id.videoId,
          thumbnail: video.snippet.thumbnails.default.url,
          title: video.snippet.title,
          createdAt: serverTimestamp(),
        };

        const newRequestRef = await addDoc(collection(firestore, 'musicRequests'), newRequestData);
        
        // Check if nothing is playing, if so, play this song immediately
        const currentState = await getDoc(jukeboxStateRef);
        if (!currentState.exists() || !currentState.data()?.currentSong) {
             const batch = writeBatch(firestore);
             batch.set(jukeboxStateRef, {
                currentSong: { id: newRequestRef.id, ...newRequestData },
                isPlaying: true,
                timestamp: serverTimestamp(),
                requesterId: user.uid,
            });
             batch.delete(newRequestRef);
             batch.set(doc(collection(firestore, 'jukeboxMessages')), {
                userId: 'system',
                userName: 'Jokebox Bot',
                text: `${userName} started the party with "${video.snippet.title}"`,
                isSystemMessage: true,
                createdAt: serverTimestamp(),
            });
            await batch.commit();
        } else {
             await addDoc(collection(firestore, 'jukeboxMessages'), {
                userId: 'system',
                userName: 'Jokebox Bot',
                text: `${userName} requested "${video.snippet.title}"`,
                isSystemMessage: true,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Song Requested!', description: `${video.snippet.title} has been added to the queue.` });
        }
    }, [user, firestore, toast, jukeboxStateRef]);

    const upNext = useMemo(() => {
        if (!requests) return [];
        return requests;
    }, [requests]);


    const handleSongEnd = useCallback(async () => {
        if (!firestore || !jukeboxStateRef) return;
        
        const nextSongInQueue = requests?.[0];
        const batch = writeBatch(firestore);

        if (nextSongInQueue) {
            // Play the next song from the queue
            batch.set(jukeboxStateRef, {
                currentSong: nextSongInQueue,
                isPlaying: true,
                timestamp: serverTimestamp(),
                requesterId: nextSongInQueue.userId,
            });
             batch.set(doc(collection(firestore, 'jukeboxMessages')), {
                userId: 'system',
                userName: 'Jokebox Bot',
                text: `Up next: "${nextSongInQueue.title}" requested by ${nextSongInQueue.userName}`,
                isSystemMessage: true,
                createdAt: serverTimestamp(),
            });
            // Delete the song that is now playing from the queue
            const songToDeleteRef = doc(firestore, 'musicRequests', nextSongInQueue.id);
            batch.delete(songToDeleteRef);
        } else {
            // No more songs in queue, clear the player
            batch.set(jukeboxStateRef, {
                currentSong: null,
                isPlaying: false,
                timestamp: serverTimestamp(),
                requesterId: null,
            });
        }
        await batch.commit();

    }, [firestore, requests, jukeboxStateRef]);
    
    const handleNextSong = useCallback(async () => {
        if (!user) return; // Must be logged in to skip
        toast({
            title: 'Skipped!',
            description: `Song skipped by ${user.displayName}.`,
        });
        // This will trigger the onSongEnd logic, which handles playing the next track
        await handleSongEnd();
    }, [toast, handleSongEnd, user]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Now Playing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <JokeboxPlayer 
                            key={jukeboxState?.currentSong?.videoId || 'no-song'}
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
                            isSongPlaying={isSongPlaying} 
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
