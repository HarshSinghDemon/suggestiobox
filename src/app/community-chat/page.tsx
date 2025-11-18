'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Message } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/chat-message';
import { MessageInput } from '@/components/chat/message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

function ChatSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-1/2 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommunityChatPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'messages'), orderBy('createdAt', 'asc'), limit(100))
        : null,
    [firestore]
  );

  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
  
  useEffect(() => {
    // Scroll to the bottom when new messages arrive
    if (viewportRef.current) {
        setTimeout(() => {
            viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages]);

  return (
    <div className="container flex flex-col h-[calc(100vh-4rem)] py-6">
        <Card className="flex flex-col flex-1 w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Community Chat</CardTitle>
                <CardDescription>
                    Ask for help, share tips, or just chat with other students.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                     <div className="p-6 space-y-4" ref={viewportRef}>
                        {isLoading ? (
                            <ChatSkeleton />
                        ) : messages && messages.length > 0 ? (
                            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
                        ) : (
                            <p className="text-center text-muted-foreground">
                            No messages yet. Be the first to say something!
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-6 border-t">
                {user ? (
                    <MessageInput />
                ) : (
                    <p className="w-full text-sm text-center text-muted-foreground">
                        Please{' '}
                        <Link href="/login" className="underline text-primary">
                            log in
                        </Link>{' '}
                        to send messages.
                    </p>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
