
'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface Mix {
    key: string;
    name: string;
    pictures: {
        large: string;
    };
    user: {
        name: string;
    };
}

function ResultSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="w-24 h-24 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MixcloudPlayer() {
    const [searchTerm, setSearchTerm] = useState('');
    const [mixes, setMixes] = useState<Mix[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMixKey, setSelectedMixKey] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        setSelectedMixKey(null);
        try {
            const response = await fetch(`https://api.mixcloud.com/search/?q=${encodeURIComponent(searchTerm)}&type=cloudcast`);
            const data = await response.json();
            setMixes(data.data || []);
        } catch (error) {
            console.error("Failed to fetch mixes:", error);
            setMixes([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search for a mix, artist, or genre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button type="button" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <ResultSkeleton />
                ) : mixes.length > 0 ? (
                    mixes.map((mix) => (
                        <div 
                            key={mix.key} 
                            className="flex items-center gap-4 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent"
                            onClick={() => setSelectedMixKey(mix.key)}
                        >
                            <Image
                                src={mix.pictures.large}
                                alt={mix.name}
                                width={96}
                                height={96}
                                className="object-cover rounded-md w-24 h-24"
                            />
                            <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{mix.name}</p>
                                <p className="text-sm text-muted-foreground truncate">by {mix.user.name}</p>
                            </div>
                            <PlayCircle className="w-8 h-8 text-primary" />
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        <p>Search for mixes to get started.</p>
                    </div>
                )}
            </div>

            {selectedMixKey && (
                <div className="mt-8">
                    <iframe
                        width="100%"
                        height="120"
                        src={`https://www.mixcloud.com/widget/iframe/?feed=${selectedMixKey}&hide_cover=1&mini=1&autoplay=1`}
                        frameBorder="0"
                        allow="autoplay"
                        title="Mixcloud Player"
                        className="rounded-lg shadow-lg"
                    ></iframe>
                </div>
            )}
        </div>
    );
}
