
'use client';

import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpotify } from "@/context/spotify-context";
import { Music, Loader2, Search, History, Star } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SpotifyTrack } from "@/lib/types";

function TrackListSkeleton() {
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

function TrackItem({ track, onPlay }: { track: SpotifyTrack, onPlay: (uri: string) => void }) {
    return (
        <button
            onClick={() => onPlay(track.uri)}
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
    )
}

export default function SpotifyPlayerPage() {
    const { 
        isLoggedIn, 
        login, 
        recentlyPlayed, 
        topTracks,
        searchResults,
        searchTracks,
        isLoading,
        playTrack,
    } = useSpotify();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        await searchTracks(searchQuery);
        setIsSearching(false);
    }
    
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
                        <CardTitle>Your Spotify Music</CardTitle>
                        <CardDescription>
                            Your recently played, top tracks, and a search away from your next song.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="search">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="search"><Search className="w-4 h-4 mr-2" />Search</TabsTrigger>
                                <TabsTrigger value="top-tracks"><Star className="w-4 h-4 mr-2" />Top Tracks</TabsTrigger>
                                <TabsTrigger value="recently-played"><History className="w-4 h-4 mr-2" />Recent</TabsTrigger>
                            </TabsList>
                            <TabsContent value="search" className="mt-4">
                                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                                    <Input 
                                        placeholder="Search for a song, artist, or album..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button type="submit" disabled={isSearching}>
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}
                                    </Button>
                                </form>
                                 {isSearching ? (
                                    <TrackListSkeleton />
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((track) => (
                                            <TrackItem key={track.id} track={track} onPlay={playTrack} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-8 text-center text-muted-foreground">Search for your favorite music to begin.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="top-tracks" className="mt-4">
                               {isLoading ? (
                                    <TrackListSkeleton />
                                ) : topTracks.length > 0 ? (
                                    <div className="space-y-2">
                                        {topTracks.map((track) => (
                                            <TrackItem key={track.id} track={track} onPlay={playTrack} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-8 text-center text-muted-foreground">Could not load your top tracks.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="recently-played" className="mt-4">
                                {isLoading ? (
                                    <TrackListSkeleton />
                                ) : recentlyPlayed.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentlyPlayed.map(({ track }) => (
                                            <TrackItem key={track.id + track.played_at} track={track} onPlay={playTrack} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-8 text-center text-muted-foreground">No recently played tracks found.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}
