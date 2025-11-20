
'use client';

import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpotify } from "@/context/spotify-context";
import { Music, Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

function RecentlyPlayedSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2 rounded-lg">
                    <Skeleton className="w-12 h-12" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function SpotifyPlayerPage() {
    const { 
        isLoggedIn, 
        login, 
        recentlyPlayed, 
        isLoading,
        playTrack,
    } = useSpotify();
    
    if (!isLoggedIn) {
        return (
             <AuthWrapper>
                <div className="container flex items-center justify-center py-12 mx-auto">
                    <Card className="max-w-md mx-auto text-center">
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <Music className="w-16 h-16 text-primary" />
                            </div>
                            <CardTitle>Connect to Spotify</CardTitle>
                            <CardDescription>
                                Log in to your Spotify account to enable the site-wide player and listen to your music anywhere on the site.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={login} disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Connect Spotify Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AuthWrapper>
        )
    }

    return (
        <AuthWrapper>
            <div className="container py-12 mx-auto">
                 <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Recently Played</CardTitle>
                        <CardDescription>
                            Here are the tracks you've recently listened to on Spotify. Click any track to start playing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <RecentlyPlayedSkeleton />
                        ) : recentlyPlayed.length > 0 ? (
                            <div className="space-y-2">
                                {recentlyPlayed.map(({ track }) => (
                                    <button
                                        key={track.id + track.played_at}
                                        onClick={() => playTrack(track.uri)}
                                        className="w-full p-2 text-left transition-colors rounded-lg flex items-center gap-4 hover:bg-accent"
                                    >
                                        <Image 
                                            src={track.album.images[0]?.url || '/placeholder.png'} 
                                            alt={track.album.name}
                                            width={48}
                                            height={48}
                                            className="rounded-md"
                                        />
                                        <div className="flex-1 truncate">
                                            <p className="font-semibold truncate">{track.name}</p>
                                            <p className="text-sm truncate text-muted-foreground">
                                                {track.artists.map(a => a.name).join(', ')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">No recently played tracks found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}