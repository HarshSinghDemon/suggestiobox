
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { JokeboxMessage } from '@/lib/types';
import { collection, query, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

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

const ChatMessage = ({ message }: { message: JokeboxMessage }) => {
    const timeAgo = message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'just now';

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
        <div className="flex items-start gap-2">
            <Avatar className="w-8 h-8">
                <AvatarImage src={message.userImage ?? undefined} />
                <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{message.userName}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
                <p className="text-sm">{message.text}</p>
            </div>
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
                    reversedMessages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
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
