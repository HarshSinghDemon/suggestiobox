
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare, Search, UserPlus, MessageSquarePlus, Lock, Users, Bot } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { FindFriendsList } from "./find-friends-list";
import { FriendsList } from "./friends-list";

function ChatListSkeleton() {
    return (
        <div className="p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-48" />
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

function PookieAIChatListItem({ isSelected, aiName }: { isSelected: boolean; aiName: string }) {
    return (
        <Link href="/messages/pookie-ai" className="block">
            <div className={cn(
                "flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-accent",
                isSelected && "bg-accent"
            )}>
                <Avatar className="w-12 h-12 border-2 border-primary/50">
                    <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold">{aiName} (AI)</p>
                    <p className="text-sm italic truncate text-muted-foreground">Your friendly neighborhood chatbot.</p>
                </div>
            </div>
        </Link>
    )
}

export function ChatList({ selectedRoomId }: { selectedRoomId?: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [pookieName, setPookieName] = useState('Pookie');

    useEffect(() => {
        const storedName = localStorage.getItem('pookieName');
        if (storedName) {
            setPookieName(storedName);
        }
    }, []);

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
            return {
                ...room,
                participantDetails: participantDetails ? [{
                    id: participantDetails.id,
                    displayName: participantDetails.displayName,
                    photoURL: participantDetails.photoURL
                }] : []
            };
        }).filter(room => room.participantDetails.length > 0);
    }, [chatRooms, currentUser, usersMap]);

    const filteredChatRooms = useMemo(() => {
        const pookieMatches = pookieName.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredP2PChats = enrichedChatRooms.filter(room => 
            room.participantDetails[0]?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return {
            pookieVisible: pookieMatches || !searchQuery.trim(),
            p2pChats: filteredP2PChats
        };

    }, [enrichedChatRooms, searchQuery, pookieName]);

    const isLoading = isLoadingUser || isLoadingRooms || (allParticipantIds.length > 0 && isLoadingUsers);

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Messages</h2>
            </div>
            <Tabs defaultValue="chats" className="flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="chats"><MessagesSquare className="w-4 h-4 mr-2" />Chats</TabsTrigger>
                        <TabsTrigger value="friends"><Users className="w-4 h-4 mr-2" />Friends</TabsTrigger>
                        <TabsTrigger value="find"><UserPlus className="w-4 h-4 mr-2" />Find</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="chats" className="flex-1 m-0 overflow-hidden">
                    <div className="p-4 border-b">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                     {isLoading ? (
                        <ChatListSkeleton />
                    ) : (
                        <div className="p-2 space-y-1">
                            {filteredChatRooms.pookieVisible && (
                                <PookieAIChatListItem isSelected={selectedRoomId === 'pookie-ai'} aiName={pookieName} />
                            )}
                            {filteredChatRooms.p2pChats.length > 0 ? (
                                filteredChatRooms.p2pChats.map(room => {
                                    const otherUser = room.participantDetails?.[0];
                                    if (!otherUser) return null;
                                    return (
                                        <Link href={`/messages/${room.id}`} key={room.id} className="block">
                                            <div className={cn(
                                                "flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-accent",
                                                selectedRoomId === room.id && "bg-accent"
                                            )}>
                                                <Avatar className="w-12 h-12">
                                                    <AvatarImage src={otherUser.photoURL ?? undefined} />
                                                    <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-semibold truncate">{otherUser.displayName}</p>
                                                    <div className="flex items-center gap-1 text-sm italic truncate text-muted-foreground">
                                                        <Lock className="w-3 h-3 shrink-0" />
                                                        <span>{room.lastMessage ? 'Encrypted message' : 'No messages yet.'}</span>
                                                    </div>
                                                </div>
                                                {room.lastMessage?.timestamp && (
                                                    <p className="text-xs text-muted-foreground self-start">
                                                        {formatDistanceToNow(room.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })
                            ) : !filteredChatRooms.pookieVisible ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-muted-foreground">
                                    <MessageSquarePlus className="w-12 h-12 mx-auto" />
                                    <p className="font-semibold">No conversations found.</p>
                                    <p className="text-sm">Your search for "{searchQuery}" returned no results.</p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </TabsContent>
                 <TabsContent value="friends" className="flex-1 m-0 overflow-y-auto">
                    <FriendsList />
                </TabsContent>
                <TabsContent value="find" className="flex-1 m-0 overflow-y-auto">
                    <FindFriendsList />
                </TabsContent>
            </Tabs>
        </div>
    )
}
