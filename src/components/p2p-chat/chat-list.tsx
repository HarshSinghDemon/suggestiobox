
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { ChatRoom, FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

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

    const chatRoomsQuery = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return query(
            collection(firestore, 'chatRooms'),
            where('participants', 'array-contains', currentUser.uid),
            orderBy('lastMessage.timestamp', 'desc')
        );
    }, [currentUser, firestore]);

    const { data: chatRooms, isLoading: isLoadingRooms } = useCollection<ChatRoom>(chatRoomsQuery);
    
    const allUserIds = useMemo(() => {
        if (!chatRooms) return [];
        const ids = new Set<string>();
        chatRooms.forEach(room => room.participants.forEach(id => ids.add(id)));
        return Array.from(ids);
    }, [chatRooms]);
    
    // Fetch all users involved in any of the chat rooms for efficiency
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || allUserIds.length === 0) return null;
        // Use a 'in' query which is very efficient for up to 30 IDs.
        return query(collection(firestore, 'users'), where('id', 'in', allUserIds));
    }, [firestore, allUserIds]);

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
        }).filter(room => room.participantDetails.length > 0); // Ensure we have participant details before rendering
    }, [chatRooms, currentUser, usersMap]);


    if (isLoadingRooms || (allUserIds.length > 0 && isLoadingUsers)) {
        return <ChatListSkeleton />;
    }
    
    if (!enrichedChatRooms || enrichedChatRooms.length === 0) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                 <MessagesSquare className="w-12 h-12 mx-auto mb-4" />
                <p className="font-semibold">No conversations yet.</p>
                <p className="text-sm">Start a chat from the Community Members page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {enrichedChatRooms.map(room => {
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
    )
}
