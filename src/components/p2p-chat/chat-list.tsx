
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare, Search, UserPlus, Bot, Edit, MoreHorizontal, LogOut, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendsList } from "./friends-list";
import { FindFriendsList } from "./find-friends-list";
import { useRouter } from "next/navigation";
import { ScrollArea } from "../ui/scroll-area";

function ChatListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

export function ChatList({ selectedRoomId }: { selectedRoomId?: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    const { data: userData, isLoading: isLoadingUser } = useDoc<FirebaseUser>(userDocRef);

    const chatRoomIds = userData?.chatRoomIds || [];

    const chatRoomsQuery = useMemoFirebase(() => {
        if (!firestore || chatRoomIds.length === 0) return null;
        return query(
            collection(firestore, 'chatRooms'),
            where('__name__', 'in', chatRoomIds),
            orderBy('lastMessage.timestamp', 'desc')
        );
    }, [firestore, chatRoomIds]);
    const { data: chatRooms, isLoading: isLoadingRooms } = useCollection<ChatRoom>(chatRoomsQuery);

    const allParticipantIds = useMemo(() => {
        if (!chatRooms) return [];
        const ids = new Set<string>();
        chatRooms.forEach(room => room.participants.forEach(id => ids.add(id)));
        return Array.from(ids);
    }, [chatRooms]);
    
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || allParticipantIds.length === 0) return null;
        return query(collection(firestore, 'users'), where('id', 'in', allParticipantIds));
    }, [firestore, allParticipantIds]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<FirebaseUser>(usersQuery);

    const usersMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);
    
    const enrichedChatRooms = useMemo(() => {
        if (!chatRooms || !currentUser || usersMap.size === 0) return [];
        return chatRooms.map(room => {
            const otherParticipantId = room.participants.find(p => p !== currentUser.uid);
            const participantDetails = otherParticipantId ? usersMap.get(otherParticipantId) : null;
            
            const isUnread = room.lastMessage && room.lastMessage.senderId !== currentUser.uid && (!room.lastRead?.[currentUser.uid] || room.lastRead[currentUser.uid] < room.lastMessage.timestamp);

            return {
                ...room,
                participantDetails: participantDetails ? [{
                    id: participantDetails.id,
                    displayName: participantDetails.displayName,
                    photoURL: participantDetails.photoURL
                }] : [],
                isUnread,
            };
        }).filter(room => room.participantDetails.length > 0);
    }, [chatRooms, currentUser, usersMap]);

    const filteredChatRooms = useMemo(() => {
        const pookieName = "Pookie (AI)";
        const pookieVisible = pookieName.toLowerCase().includes(searchQuery.toLowerCase());

        const userChats = enrichedChatRooms.filter(room => 
            room.participantDetails[0]?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return { userChats, pookieVisible };

    }, [enrichedChatRooms, searchQuery]);

    const isLoading = isLoadingUser || isLoadingRooms || (allParticipantIds.length > 0 && isLoadingUsers);

    return (
      <div className="h-full w-full flex flex-col p-4 md:p-6 glass-pane md:rounded-r-2xl">
        <header className="flex items-center justify-between pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={currentUser?.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(currentUser?.displayName)}</AvatarFallback>
                </Avatar>
                <div className="font-semibold text-lg">
                    <p>Good Morning!</p>
                </div>
            </div>
             <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <LogOut className="w-5 h-5"/>
            </Button>
        </header>

        <div className="py-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                    placeholder="Search..."
                    className="pl-9 h-10 rounded-full bg-white/10 border-none focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <div className="flex items-center gap-2 py-2">
            <Button variant={selectedRoomId ? "ghost" : "secondary"} className="rounded-full">Chats</Button>
            <Button variant="ghost" className="rounded-full">Groups</Button>
        </div>

        <div className="flex-1 min-h-0 -mr-4">
          <ScrollArea className="h-full pr-4">
              {isLoading ? (
                  <ChatListSkeleton />
              ) : (
                  <div className="space-y-1">
                      {filteredChatRooms.pookieVisible && (
                           <Link href="/messages/pookie-ai" className="block">
                              <div className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-white/20",
                                  selectedRoomId === 'pookie-ai' && "bg-white/20"
                              )}>
                                  <Avatar className="w-12 h-12">
                                      <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
                                      <AvatarFallback><Bot /></AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 overflow-hidden">
                                      <div className="flex items-baseline justify-between">
                                          <p className="font-semibold truncate">Pookie (AI)</p>
                                      </div>
                                      <p className="text-sm truncate text-white/70">Your personal AI friend</p>
                                  </div>
                              </div>
                          </Link>
                      )}
                      {filteredChatRooms.userChats.length > 0 ? (
                          filteredChatRooms.userChats.map(room => {
                              const otherUser = room.participantDetails?.[0];
                              if (!otherUser) return null;
                              return (
                                  <Link href={`/messages/${room.id}`} key={room.id} className="block">
                                      <div className={cn(
                                          "flex items-center gap-3 p-2.5 rounded-2xl transition-colors hover:bg-white/20",
                                          selectedRoomId === room.id && "bg-white/20"
                                      )}>
                                          <div className="relative">
                                              <Avatar className="w-12 h-12">
                                                  <AvatarImage src={otherUser.photoURL ?? undefined} />
                                                  <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                                              </Avatar>
                                              <div className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full border-background bg-green-500"></div>
                                          </div>
                                          <div className="flex-1 overflow-hidden">
                                              <div className="flex items-baseline justify-between">
                                                  <p className="font-semibold truncate">{otherUser.displayName}</p>
                                                  {room.lastMessage?.timestamp && (
                                                      <p className="text-xs text-white/50 self-start shrink-0">
                                                          {formatDistanceToNow(room.lastMessage.timestamp.toDate(), { addSuffix: true, includeSeconds: true }).replace('about ','').replace('less than a minute ago', 'now')}
                                                      </p>
                                                  )}
                                              </div>
                                              <div className="flex items-center justify-between">
                                                  <p className={cn("text-sm truncate", room.isUnread ? "text-white font-medium" : "text-white/60")}>
                                                      {room.lastMessage ? (
                                                          (room.lastMessage.senderId === currentUser?.uid ? "You: " : "") + 
                                                          (room.lastMessage.text || "Encrypted message")
                                                      ) : "No messages yet."}
                                                  </p>
                                                  {room.isUnread && (
                                                      <div className="flex items-center justify-center w-5 h-5 text-xs text-white rounded-full bg-primary shrink-0">
                                                          1
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </Link>
                              )
                          })
                      ) : !filteredChatRooms.pookieVisible ? (
                           <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-white/50">
                              <MessagesSquare className="w-12 h-12 mx-auto" />
                              <p className="font-semibold">No conversations found.</p>
                          </div>
                      ) : null}
                  </div>
              )}
          </ScrollArea>
        </div>
         <div className="pt-4 mt-auto">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full h-12 rounded-full">
                        <Plus className="w-5 h-5 mr-2"/>
                        New Chat
                    </Button>
                </DialogTrigger>
                <DialogContent className="p-0 border-0 max-w-md glass-pane">
                    <Tabs defaultValue="friends" className="w-full">
                        <DialogHeader className="p-4 border-b border-white/20">
                            <DialogTitle>Start a new chat</DialogTitle>
                            <TabsList className="grid w-full grid-cols-2 mt-2 bg-white/10">
                                <TabsTrigger value="friends">Friends</TabsTrigger>
                                <TabsTrigger value="find">Find People</TabsTrigger>
                            </TabsList>
                        </DialogHeader>
                        <TabsContent value="friends" className="m-0">
                            <FriendsList />
                        </TabsContent>
                        <TabsContent value="find" className="m-0">
                            <FindFriendsList />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
      </div>
    )
}
