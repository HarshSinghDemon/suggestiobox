
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Play, Send } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters.'),
});

export type SearchResult = {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { default: { url: string } };
  };
};

interface RequestFormProps {
    onPlaySong: (song: SearchResult) => void;
    onAddToQueue: (song: SearchResult) => Promise<void>;
}

export function RequestForm({ onPlaySong, onAddToQueue }: RequestFormProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submittingSongId, setSubmittingSongId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '' },
  });

  const handleSearch = async ({ query }: { query: string }) => {
    setIsSearching(true);
    setSearchResults([]);
    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!apiKey) throw new Error('YouTube API key is not configured.');

      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}&maxResults=10`);
      if (!response.ok) throw new Error('Failed to fetch from YouTube.');

      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Search Failed', description: error.message });
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueueClick = async (video: SearchResult) => {
    setSubmittingSongId(video.id.videoId);
    await onAddToQueue(video);
    setSubmittingSongId(null);
  };
  
  const handlePlayClick = (video: SearchResult) => {
    onPlaySong(video);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(handleSearch)} className="flex gap-2">
        <Input {...form.register('query')} placeholder="Search for a song..." disabled={isSearching} />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </form>
      
      {isSearching && <Loader2 className="w-6 h-6 mx-auto my-4 animate-spin" />}

      {searchResults.length > 0 && (
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div key={result.id.videoId}>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                    <Image src={result.snippet.thumbnails.default.url} alt={result.snippet.title} width={64} height={48} className="rounded-md shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.snippet.title}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button size="icon" variant="outline" onClick={() => handlePlayClick(result)} disabled={!!submittingSongId} aria-label="Play Now">
                            <Play className="w-4 h-4" />
                        </Button>
                        <Button size="icon" onClick={() => handleQueueClick(result)} disabled={!!submittingSongId} aria-label="Add to Queue">
                            {submittingSongId === result.id.videoId ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
