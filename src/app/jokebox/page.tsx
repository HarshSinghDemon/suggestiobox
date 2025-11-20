
'use client';

import { Suspense, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Radio } from 'lucide-react';
import { RequestForm, type SearchResult } from '@/components/jokebox/request-form';
import { RequestsList } from '@/components/jokebox/requests-list';
import { JokeboxPlayer } from '@/components/jokebox/jokebox-player';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { MusicRequest } from '@/lib/types';

const JokeboxPageContent = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedSong, setSelectedSong] = useState<MusicRequest | null>(null);

    const requestsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'musicRequests'), orderBy('createdAt', 'asc'), limit(50)) : null),
        [firestore]
    );
    const { data: requests, isLoading } = useCollection<MusicRequest>(requestsQuery);

    const handleSelectSong = (searchResult: SearchResult) => {
        // Convert SearchResult to MusicRequest format for the player
        const songToPlay: MusicRequest = {
            id: searchResult.id.videoId, // Use videoId as a temporary unique key
            videoId: searchResult.id.videoId,
            title: searchResult.snippet.title,
            thumbnail: searchResult.snippet.thumbnails.default.url,
            userName: user?.displayName || 'You',
            userId: user?.uid || 'anonymous',
            songName: searchResult.snippet.title,
            createdAt: new Date() as any, // Not a real timestamp, but satisfies the type
        };
        setSelectedSong(songToPlay);
    };

    const handleSongEnd = () => {
        // When a directly selected song ends, clear it to let the queue play next
        if (selectedSong) {
            setSelectedSong(null);
        }
    };
    
    // The player should prioritize the directly selected song, otherwise play from the queue.
    const currentSong = selectedSong || requests?.[0];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Now Playing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <JokeboxPlayer 
                            song={currentSong} 
                            onSongEnd={handleSongEnd}
                            isQueueSong={!selectedSong && !!requests?.[0]}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Request a Song</CardTitle>
                        <CardDescription>Search for a song on YouTube to play it directly or add it to the queue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RequestForm onPlaySong={handleSelectSong} />
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Up Next</CardTitle>
                </CardHeader>
                <CardContent>
                    <RequestsList requests={requests?.slice(1) ?? []} isLoading={isLoading} />
                </CardContent>
            </Card>
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
