
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare, Search, UserPlus, Bot, Edit } from "lucide-react";
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
import { ChatHeader } from "./chat-header";

function ChatListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-16 h-16 rounded-full" />
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
        <div className="flex flex-col h-full bg-transparent">
             <ChatHeader>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Edit className="w-5 h-5"/>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 border-0 max-w-md">
                        <Tabs defaultValue="friends" className="w-full">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>Manage Friends</DialogTitle>
                                <TabsList className="grid w-full grid-cols-2 mt-2">
                                    <TabsTrigger value="friends">Friends</TabsTrigger>
                                    <TabsTrigger value="find">Find</TabsTrigger>
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
             </ChatHeader>
             <div className="px-4 pb-2 shrink-0">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 bg-input h-10 rounded-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
             <div className="flex-1 min-h-0 overflow-y-auto px-2">
                 {isLoading ? (
                    <ChatListSkeleton />
                ) : (
                    <div className="space-y-1">
                        {filteredChatRooms.pookieVisible && (
                             <Link href="/messages/pookie-ai" className="block">
                                <div className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted",
                                    selectedRoomId === 'pookie-ai' && "bg-muted"
                                )}>
                                    <Avatar className="w-14 h-14">
                                        <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-baseline justify-between">
                                            <p className="font-semibold truncate">Pookie (AI)</p>
                                        </div>
                                        <p className="text-sm truncate text-muted-foreground">Your personal AI friend</p>
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
                                            "flex items-center gap-3 p-2.5 rounded-2xl transition-colors hover:bg-muted",
                                            selectedRoomId === room.id && "bg-muted"
                                        )}>
                                            <Avatar className="w-14 h-14">
                                                <AvatarImage src={otherUser.photoURL ?? undefined} />
                                                <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-baseline justify-between">
                                                    <p className="font-semibold truncate">{otherUser.displayName}</p>
                                                    {room.lastMessage?.timestamp && (
                                                        <p className="text-xs text-muted-foreground self-start shrink-0">
                                                            {formatDistanceToNow(room.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("text-sm truncate", room.isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
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
                             <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-muted-foreground">
                                <MessagesSquare className="w-12 h-12 mx-auto" />
                                <p className="font-semibold">No conversations found.</p>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}
