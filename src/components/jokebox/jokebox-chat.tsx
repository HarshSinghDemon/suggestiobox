
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import type { JokeboxMessage, FirebaseUser } from '@/lib/types';
import { collection, query, orderBy, limit, serverTimestamp, addDoc, where, getDocs, writeBatch, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Send, Loader2, Bot, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
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


function ChatSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-1/2 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
};

const ChatMessage = ({ message, currentUser, isAdmin }: { message: JokeboxMessage, currentUser: FirebaseUser | null, isAdmin: boolean }) => {
    const firestore = useFirestore();
    const timeAgo = message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'just now';

    const canDelete = currentUser && (currentUser.uid === message.userId || isAdmin);

    const handleDelete = async () => {
        if (!firestore) return;
        const messageRef = doc(firestore, 'jukeboxMessages', message.id);
        await deleteDoc(messageRef);
    }

    if (message.isSystemMessage) {
        return (
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="w-4 h-4"/>
                <p>
                    <span className="italic">{message.text}</span>
                    <span className="ml-2 text-xs">({timeAgo})</span>
                </p>
            </div>
        )
    }

    return (
        <div className="flex items-start gap-2 group">
            <Avatar className="w-8 h-8">
                <AvatarImage src={message.userImage ?? undefined} />
                <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
            </Avatar>
            <div className='flex-1'>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{message.userName}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
                <p className="text-sm">{message.text}</p>
            </div>
            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this message.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )
}


export function JokeboxChat() {
  const { user } = useUser();
  const firestore = useFirestore();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData } = useDoc<FirebaseUser>(userDocRef);
  const isAdmin = userData?.role === 'admin';

  const messagesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'jukeboxMessages'), orderBy('createdAt', 'desc'), limit(50))
        : null,
    [firestore]
  );
  const { data: messages, isLoading } = useCollection<JokeboxMessage>(messagesQuery);
  const reversedMessages = useMemo(() => messages?.slice().reverse() ?? [], [messages]);
  
  useEffect(() => {
    const cleanupOldMessages = async () => {
        if (!firestore) return;

        // Query only for system messages
        const systemMessagesQuery = query(
            collection(firestore, 'jukeboxMessages'),
            where('isSystemMessage', '==', true)
        );

        try {
            const querySnapshot = await getDocs(systemMessagesQuery);
            if (querySnapshot.empty) return;

            const batch = writeBatch(firestore);
            let deletedCount = 0;
            const twoMinutesAgo = Date.now() - 2 * 60 * 1000;

            querySnapshot.forEach(doc => {
                const messageData = doc.data() as JokeboxMessage;
                // Filter by date on the client
                if (messageData.createdAt && messageData.createdAt.toMillis() < twoMinutesAgo) {
                    batch.delete(doc.ref);
                    deletedCount++;
                }
            });

            if (deletedCount > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Failed to clean up old system messages:", error);
            // This error is silent to the user as it's a background task.
        }
    };

    const intervalId = setInterval(cleanupOldMessages, 2 * 60 * 1000); // Run every 2 minutes
    cleanupOldMessages(); // Run once on mount

    return () => clearInterval(intervalId); // Cleanup on unmount
}, [firestore]);


  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
            viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || message.trim() === '') return;
    setIsSending(true);

    try {
        await addDoc(collection(firestore, 'jukeboxMessages'), {
            text: message.trim(),
            createdAt: serverTimestamp(),
            userId: user.uid,
            userName: user.displayName,
            userImage: user.photoURL,
        });
        setMessage('');
    } catch (error) {
        console.error('Error sending message:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    } finally {
        setIsSending(false);
    }
  };


  return (
    <div className="flex flex-col h-[500px]">
        <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4" ref={viewportRef}>
                {isLoading ? (
                    <ChatSkeleton />
                ) : reversedMessages && reversedMessages.length > 0 ? (
                    reversedMessages.map((msg) => <ChatMessage key={msg.id} message={msg} currentUser={user} isAdmin={isAdmin} />)
                ) : (
                    <p className="text-sm text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                )}
            </div>
        </ScrollArea>
        <div className="pt-4 mt-4 border-t">
            {user ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Input 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Say something..."
                        disabled={isSending}
                    />
                    <Button type="submit" size="icon" disabled={isSending || message.trim() === ''}>
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            ) : (
                <p className="text-sm text-center text-muted-foreground">
                    <Link href="/login" className="underline">Log in</Link> to chat.
                </p>
            )}
        </div>
    </div>
  );
}
