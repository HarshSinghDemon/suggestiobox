
'use client';

import type { MusicRequest, FirebaseUser } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RequestsListProps {
    requests: MusicRequest[];
    isLoading: boolean;
}

export function RequestsList({ requests, isLoading }: RequestsListProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userData } = useDoc<FirebaseUser>(userDocRef);

    const isAdmin = userData?.role === 'admin';

    const handleDelete = async (requestId: string) => {
        if (!firestore) return;
        try {
            const songRef = doc(firestore, 'musicRequests', requestId);
            await deleteDoc(songRef);
            toast({
                title: 'Song Removed',
                description: 'The song has been removed from the queue.',
            });
        } catch (error) {
            console.error('Error removing song:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not remove the song from the queue.',
            });
        }
    };


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
                {requests.map((req) => {
                    const canDelete = user && (user.uid === req.userId || isAdmin);
                    return (
                        <div key={req.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center flex-1 gap-4 min-w-0">
                                <Image src={req.thumbnail} alt={req.title} width={64} height={48} className="rounded-md" />
                                <div className="flex-1 truncate">
                                    <p className="text-sm font-semibold truncate">{req.title}</p>
                                    <p className="text-xs text-muted-foreground">by {req.userName}</p>
                                </div>
                            </div>
                            {canDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently remove this song from the queue.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(req.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
