
'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Radio } from 'lucide-react';
import { RequestForm, type SearchResult } from '@/components/jokebox/request-form';
import { RequestsList } from '@/components/jokebox/requests-list';
import { JokeboxPlayer } from '@/components/jokebox/jokebox-player';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import type { MusicRequest } from '@/lib/types';
import { JokeboxChat } from '@/components/jokebox/jokebox-chat';
import { useToast } from '@/hooks/use-toast';


const JokeboxPageContent = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedSong, setSelectedSong] = useState<MusicRequest | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { toast } = useToast();

    const requestsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'musicRequests'), orderBy('createdAt', 'asc'), limit(50)) : null),
        [firestore]
    );
    const { data: requests, isLoading } = useCollection<MusicRequest>(requestsQuery);

    const handlePlayNow = (searchResult: SearchResult) => {
        const songToPlay: MusicRequest = {
            id: searchResult.id.videoId,
            videoId: searchResult.id.videoId,
            title: searchResult.snippet.title,
            thumbnail: searchResult.snippet.thumbnails.default.url,
            userName: user?.displayName || 'You',
            userId: user?.uid || 'anonymous',
            songName: searchResult.snippet.title,
            createdAt: Timestamp.now(),
        };
        setSelectedSong(songToPlay);
        setIsPlaying(true);
        toast({ title: 'Playing Now', description: songToPlay.title });
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

        const docRef = await addDocumentNonBlocking(collection(firestore, 'musicRequests'), newRequest);
        
        await addDocumentNonBlocking(collection(firestore, 'jukeboxMessages'), {
          userId: 'system',
          userName: 'Jokebox Bot',
          text: `${userName} requested "${video.snippet.title}"`,
          isSystemMessage: true,
          createdAt: serverTimestamp(),
        });
  
        toast({ title: 'Song Requested!', description: `${video.snippet.title} has been added to the queue.` });
    };

    const nowPlaying = useMemo(() => {
        if (selectedSong) return selectedSong;
        if (requests && requests.length > 0) {
            return requests[0];
        }
        return null;
    }, [selectedSong, requests]);

    const upNext = useMemo(() => {
        if (!requests) return [];
        return requests.slice(1);
    }, [requests]);

    const handleSongEnd = () => {
        // Only remove from queue if it was a queue song (i.e. not a manually selected one)
        if (nowPlaying && !selectedSong && firestore) {
            const songRef = doc(firestore, 'musicRequests', nowPlaying.id);
            deleteDocumentNonBlocking(songRef);
        }
        setSelectedSong(null); // Clear any manually selected song
        setIsPlaying(false); // Allow next song in queue to start
    };
    
    const handleNextSong = () => {
        toast({
            title: 'Skipped!',
            description: `Skipping to the next song.`,
        });
        handleSongEnd();
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
                            song={nowPlaying} 
                            onSongEnd={handleSongEnd}
                            onNextSong={handleNextSong}
                            onPlayerStateChange={(state) => {
                                const currentlyPlaying = state === 'playing' || state === 'buffering';
                                if(currentlyPlaying !== isPlaying) {
                                    setIsPlaying(currentlyPlaying);
                                }
                            }}
                            autoPlay={!!(requests && requests.length > 0 && !selectedSong)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Request a Song</CardTitle>
                        <CardDescription>Search for a song on YouTube to play it directly or add it to the queue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RequestForm onPlaySong={handlePlayNow} onAddToQueue={handleAddToQueue} isSongPlaying={isPlaying} />
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
