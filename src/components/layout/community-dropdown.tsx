
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Gamepad2,
  MessageSquare,
  Music,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChatRoom } from '@/lib/types';
import { useRouter } from 'next/navigation';

function GoldenDot() {
  return (
    <span className="absolute top-0 right-0 flex w-2.5 h-2.5">
      <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-amber-400"></span>
      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-amber-500"></span>
    </span>
  );
}

export function CommunityDropdown() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const chatRoomsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(
      collection(firestore, 'chatRooms'),
      where('participants', 'array-contains', user.uid)
    );
  }, [user?.uid, firestore]);

  const { data: chatRooms, isLoading: isLoadingChatRooms } =
    useCollection<ChatRoom>(chatRoomsQuery);

  const hasUnreadMessages = useMemo(() => {
    if (!chatRooms || !user?.uid) return false;
    return chatRooms.some((room) => {
      const lastMessageTimestamp = room.lastMessage?.timestamp;
      // No dot if there's no last message or the user sent it
      if (!lastMessageTimestamp || room.lastMessage.senderId === user.uid) {
        return false;
      }
      
      const lastReadTimestamp = room.lastRead?.[user.uid];
      // If user has never read this room, there's a new message
      if (!lastReadTimestamp) {
          return true;
      }
      
      // If the last message is newer than the last time the user read it
      return lastMessageTimestamp.toMillis() > lastReadTimestamp.toMillis();
    });
  }, [chatRooms, user?.uid]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative hidden gap-1 font-medium text-foreground/60 hover:text-foreground/80 md:flex"
        >
          Community
          <ChevronDown className="w-4 h-4" />
          {isClient && hasUnreadMessages && !isLoadingChatRooms && <GoldenDot />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => router.push('/community-chat')}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Community Chat
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/messages')}
          className="relative"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Private Messages
          {isClient && hasUnreadMessages && <GoldenDot />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/community-members')}>
          <Users className="w-4 h-4 mr-2" />
          Community Members
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/community-game')}>
          <Gamepad2 className="w-4 h-4 mr-2" />
          Community Games
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/jokebox')}>
          <Music className="w-4 h-4 mr-2" />
          Jokebox
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
