
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Message, FirebaseUser } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/chat-message';
import { MessageInput } from '@/components/chat/message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

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

function CommunityChatPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const viewportRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'messages'), orderBy('createdAt', 'asc'), limit(100))
        : null,
    [firestore]
  );

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  const { data: users, isLoading: isLoadingUsers } = useCollection<FirebaseUser>(usersQuery);

  const usersMap = useMemo(() => {
    if (!users) return new Map<string, FirebaseUser>();
    return new Map(users.map(u => [u.id, u]));
  }, [users]);

  const totalUsers = users?.length ?? 0;
  
  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
            viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages]);

  const isLoading = isLoadingMessages || isLoadingUsers;

  return (
    <AuthWrapper>
      <div className="container flex flex-col h-[calc(100vh-4rem)] py-6">
          <style jsx global>{`
              @keyframes-fade-in-up {
                  from {
                      opacity: 0;
                      transform: translateY(10px);
                  }
                  to {
                      opacity: 1;
                      transform: translateY(0);
                  }
              }
              .animate-fade-in-up {
                  animation: keyframes-fade-in-up 0.5s ease-out forwards;
              }
          `}</style>
          <Card className="flex flex-col flex-1 w-full max-w-4xl mx-auto">
              <CardHeader>
                  <CardTitle>Community Chat</CardTitle>
                  <div className="flex items-center justify-between">
                    <CardDescription>
                        Ask for help, share tips, or just chat with other students.
                    </CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {isLoadingUsers ? (
                        <Skeleton className="w-8 h-4" />
                      ) : (
                        <span>{totalUsers}</span>
                      )}
                      <span>{totalUsers === 1 ? 'user' : 'users'} online</span>
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full" viewportRef={viewportRef}>
                       <div className="p-6 space-y-4">
                          {isLoading ? (
                              <ChatSkeleton />
                          ) : messages && messages.length > 0 ? (
                              messages.map((msg) => <ChatMessage key={msg.id} message={msg} author={usersMap.get(msg.userId)} />)
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
                          <Link href="/login" className="underline text-primary" prefetch={false}>
                              log in
                          </Link>{' '}
                          to send messages.
                      </p>
                  )}
              </CardFooter>
          </Card>
      </div>
    </AuthWrapper>
  );
}


export default memo(CommunityChatPage);
