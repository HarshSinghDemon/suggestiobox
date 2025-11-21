

'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

function ChatListSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
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

export function ChatList() {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');

    // 1. Fetch the current user's data to get their chatRoomIds
    const userDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    const { data: userData, isLoading: isLoadingUser } = useDoc<FirebaseUser>(userDocRef);

    const chatRoomIds = userData?.chatRoomIds || [];

    // 2. Fetch only the chat rooms the user is part of
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
    
    // 3. Fetch all participant profiles in one query
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || allParticipantIds.length === 0) return null;
        return query(collection(firestore, 'users'), where('id', 'in', allParticipantIds));
    }, [firestore, allParticipantIds]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<FirebaseUser>(usersQuery);

    const usersMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);
    
    // 4. Join the data on the client
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
        if (!enrichedChatRooms) return [];
        if (!searchQuery.trim()) return enrichedChatRooms;
        
        return enrichedChatRooms.filter(room => 
            room.participantDetails[0]?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [enrichedChatRooms, searchQuery]);


    const isLoading = isLoadingUser || isLoadingRooms || (allParticipantIds.length > 0 && isLoadingUsers);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             {isLoading ? (
                <ChatListSkeleton />
            ) : filteredChatRooms && filteredChatRooms.length > 0 ? (
                 <div className="space-y-2">
                    {filteredChatRooms.map(room => {
                        const otherUser = room.participantDetails?.[0];
                        if (!otherUser) return null;
                        return (
                            <Link href={`/messages/${room.id}`} key={room.id}>
                                <div className={cn(
                                    "flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-accent",
                                    "animate-fade-in-up"
                                )}>
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={otherUser.photoURL ?? undefined} />
                                        <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{otherUser.displayName}</p>
                                        <p className="text-sm truncate text-muted-foreground">
                                            {room.lastMessage?.text || 'No messages yet.'}
                                        </p>
                                    </div>
                                    {room.lastMessage?.timestamp && (
                                        <p className="text-xs text-muted-foreground self-start">
                                            {formatDistanceToNow(room.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="py-16 text-center text-muted-foreground">
                    <MessagesSquare className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-semibold">No conversations found.</p>
                    <p className="text-sm">Start a chat from the Community Members page or clear your search.</p>
                </div>
            )}
        </div>
    )
}
