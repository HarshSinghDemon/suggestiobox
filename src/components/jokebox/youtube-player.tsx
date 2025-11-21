
'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
    Search, 
    Play, 
    Plus, 
    Loader2,
    Music2
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useAudio, type JokeboxTrack } from '../layout/audio-provider';

interface YouTubeSearchResult {
    id: { videoId: string };
    snippet: {
        title:string;
        channelTitle: string;
        thumbnails: { medium: { url: string }};
    };
}

interface YoutubePlayerProps {
    apiKey: string;
    className?: string;
}

export function YoutubePlayer({ apiKey, className }: YoutubePlayerProps) {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<JokeboxTrack[]>([]);
    
    const { 
        currentJokeboxTrack, 
        isJokeboxPlaying, 
        playJokeboxTrack, 
        addToJokeboxPlaylist 
    } = useAudio();

    const searchSongs = useCallback(async () => {
        if (!query.trim()) return;
        setIsLoading(true);

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=20&videoCategoryId=10&key=${apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || "API request failed. Check your API key or quota.");
            }
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                toast({ title: 'No songs found', description: `Your search for "${query}" returned no results.` });
                setSearchResults([]);
                return;
            }
            
            const decodedTitle = (title: string) => {
                try {
                    const txt = document.createElement("textarea");
                    txt.innerHTML = title;
                    return txt.value;
                } catch {
                    return title; // Fallback for non-browser environments
                }
            };

            const tracks: JokeboxTrack[] = data.items.map((item: YouTubeSearchResult) => ({
                id: item.id.videoId,
                title: decodedTitle(item.snippet.title),
                channel: decodedTitle(item.snippet.channelTitle),
                thumbnail: item.snippet.thumbnails.medium.url,
            }));
            setSearchResults(tracks);
        } catch (error: any) {
            console.error("YouTube Search Error:", error);
            toast({ variant: 'destructive', title: 'Search Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [query, toast, apiKey]);

    const SearchResults = () => (
        <ScrollArea className='h-full'>
            <div className="p-1 sm:p-4 space-y-2">
                {isLoading && searchResults.length === 0 ? (
                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="w-full h-20 rounded-md" />)
                ) : searchResults.length > 0 ? (
                    searchResults.map((track, index) => (
                        <div key={track.id} 
                             className="flex items-center gap-3 p-2 rounded-md group hover:bg-accent animate-fade-in-up"
                             style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => addToJokeboxPlaylist(track)}><Plus className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => playJokeboxTrack(track)}><Play className={cn("w-4 h-4", isJokeboxPlaying && currentJokeboxTrack?.id === track.id ? "text-amber-400" : "")}/></Button>
                            </div>
                            <div className='relative overflow-hidden rounded-md shrink-0 w-14 h-14'>
                                <Image src={track.thumbnail} alt={track.title} layout='fill' className="object-cover transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{track.title}</p>
                                <p className="text-sm truncate text-muted-foreground">{track.channel}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-24 animate-fade-in-scale">
                        <Music2 className="w-16 h-16 mb-4 text-primary/50" />
                        <h3 className='text-xl font-semibold'>Find Your Sound</h3>
                        <p className='max-w-xs text-sm'>Search for songs, artists, or albums to start building your playlist.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="p-4 border-b">
                <form onSubmit={(e) => { e.preventDefault(); searchSongs(); }} className="flex gap-2">
                    <Input
                        placeholder="Search songs, artists, albums..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className='text-base'
                    />
                    <Button type="submit" disabled={isLoading} className='shrink-0'>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
            <div className="flex-1 min-h-0">
                <Suspense fallback={<p>Loading search results...</p>}>
                    <SearchResults />
                </Suspense>
            </div>
        </div>
    );
}

    