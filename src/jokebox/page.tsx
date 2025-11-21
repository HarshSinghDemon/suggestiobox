
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { YoutubePlayer } from '@/components/jokebox/youtube-player';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Music } from 'lucide-react';
import { useAudio } from '@/components/layout/audio-provider';
import { ListMusic, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function JokeboxSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-24 h-10" />
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
                        <Skeleton className="w-16 h-16" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const Playlist = () => {
    const { jokeboxPlaylist, currentJokeboxTrack, playJokeboxTrack, removeFromJokeboxPlaylist } = useAudio();
    return (
        <div className="flex flex-col h-full bg-card">
            <h3 className="p-4 text-lg font-semibold tracking-tight border-b">
                <ListMusic className="inline w-5 h-5 mr-2" />
                My Playlist
            </h3>
            <ScrollArea className='flex-1'>
                <div className="p-2 space-y-1">
                    {jokeboxPlaylist.length > 0 ? (
                        jokeboxPlaylist.map((track, index) => (
                            <div key={track.id} 
                                 className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer group hover:bg-accent", currentJokeboxTrack?.id === track.id && "bg-primary/20")}
                                 onClick={() => playJokeboxTrack(track)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-semibold truncate", currentJokeboxTrack?.id === track.id && "text-amber-300")}>{track.title}</p>
                                    <p className="text-xs truncate text-muted-foreground">{track.channel}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="w-6 h-6 transition-opacity shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFromJokeboxPlaylist(track.id); }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-12 animate-fade-in-scale">
                            <ListMusic className="w-10 h-10 mb-2" />
                            <p className="text-sm">Your playlist is empty.</p>
                            <p className="text-xs">Add songs from search results.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};


export default function JokeboxPage() {
    const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    if (!youtubeApiKey) {
      return (
          <AuthWrapper>
              <div className="container py-8 mx-auto">
                  <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertTitle>Configuration Error</AlertTitle>
                      <AlertDescription>
                          The YouTube API Key is not configured. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your .env file.
                      </AlertDescription>
                  </Alert>
              </div>
          </AuthWrapper>
      );
    }

    return (
        <AuthWrapper>
            <div className="container flex flex-col h-[calc(100vh-4rem)] py-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className='p-2 rounded-lg bg-primary/20'>
                        <Music className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Jokebox</h1>
                        <p className="text-muted-foreground">Your personal audio-only YouTube player.</p>
                    </div>
                </div>
                <div className="flex-1 min-h-0 md:grid md:grid-cols-3 md:gap-6">
                     <div className="flex-1 overflow-hidden border rounded-lg bg-card text-card-foreground md:col-span-2">
                        <Suspense fallback={<JokeboxSkeleton />}>
                            <YoutubePlayer apiKey={youtubeApiKey} className="h-full" />
                        </Suspense>
                    </div>
                    <div className="hidden h-full overflow-hidden border rounded-lg md:block">
                        <Playlist />
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}

    