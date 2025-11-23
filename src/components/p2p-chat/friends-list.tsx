
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import type { FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Users, Search, Loader2, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { findOrCreateChat } from "@/lib/chat";
import { useRouter } from "next/navigation";
import { ScrollArea } from "../ui/scroll-area";

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
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

function FriendItem({ friend }: { friend: FirebaseUser }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleStartChat = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const roomId = await findOrCreateChat(firestore, currentUser.uid, friend.id);
            router.push(`/messages/${roomId}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start chat.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
            <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={friend.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{friend.displayName}</p>
                    <p className="text-sm text-muted-foreground">{friend.year} Year</p>
                </div>
            </div>
            <Button size="sm" onClick={handleStartChat} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Chat
            </Button>
        </div>
    )
}

export function FriendsList() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const [searchQuery, setSearchQuery] = useState('');

    const currentUserDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    
    const { data: currentUserData, isLoading: isLoadingCurrentUser } = useDoc<FirebaseUser>(currentUserDocRef);
    
    const friendIds = useMemo(() => currentUserData?.friends || [], [currentUserData]);

    const friendsQuery = useMemoFirebase(() => {
        if (!firestore || friendIds.length === 0) return null;
        return query(collection(firestore, 'users'), where('id', 'in', friendIds));
    }, [firestore, friendIds]);

    const { data: friends, isLoading: isLoadingFriends } = useCollection<FirebaseUser>(friendsQuery);

    const filteredFriends = useMemo(() => {
        if (!friends) return [];
        if (!searchQuery.trim()) return friends;
        
        return friends.filter(friend => 
            friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [friends, searchQuery]);

    const isLoading = isLoadingCurrentUser || (friendIds.length > 0 && isLoadingFriends);

    return (
        <div className="space-y-4">
            <div className="relative p-4 border-b">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search friends..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <ScrollArea className="h-[350px]">
                {isLoading ? (
                    <ListSkeleton />
                ) : filteredFriends && filteredFriends.length > 0 ? (
                    <div className="space-y-2 p-2">
                        {filteredFriends.map(friend => (
                            <FriendItem key={friend.id} friend={friend} />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-semibold">No friends yet.</p>
                        <p className="text-sm">Use the 'Find' tab to add friends.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
