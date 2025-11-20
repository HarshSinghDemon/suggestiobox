
'use client';

import type { MusicRequest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface RequestsListProps {
    requests: MusicRequest[];
    isLoading: boolean;
}

export function RequestsList({ requests, isLoading }: RequestsListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-16 h-12" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-3/4 h-4" />
                            <Skeleton className="w-1/2 h-4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (requests.length === 0) {
        return <p className="text-sm text-center text-muted-foreground">The queue is empty.</p>;
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="space-y-4">
                {requests.map((req) => (
                    <div key={req.id} className="flex items-center gap-4">
                        <Image src={req.thumbnail} alt={req.title} width={64} height={48} className="rounded-md" />
                        <div className="flex-1 truncate">
                            <p className="text-sm font-semibold truncate">{req.title}</p>
                            <p className="text-xs text-muted-foreground">by {req.userName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
