

'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, where, doc } from "firebase/firestore";
import type { FirebaseUser } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Users, Search, Loader2, UserPlus, UserCheck, Check, X, MessageSquare, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, sendFriendRequest } from "@/lib/friends";
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

function ActionButton({ otherUser }: { otherUser: FirebaseUser }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const currentUserDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    const { data: currentUserData } = useDoc<FirebaseUser>(currentUserDocRef);
    
    if (!currentUser || !currentUserData || !otherUser || currentUser.uid === otherUser.id) {
        return null; // Don't show buttons for self
    }

    const isFriend = currentUserData.friends?.includes(otherUser.id);
    const requestSent = currentUserData.friendRequestsSent?.includes(otherUser.id);
    const requestReceived = currentUserData.friendRequestsReceived?.includes(otherUser.id);

    const handleStartChat = async () => {
        setIsLoading(true);
        try {
            const roomId = await findOrCreateChat(firestore, currentUser.uid, otherUser.id);
            router.push(`/messages/${roomId}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start chat.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddFriend = async () => {
        setIsLoading(true);
        try {
            await sendFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Sent!", description: `Friend request sent to ${otherUser.displayName}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCancelRequest = async () => {
        setIsLoading(true);
        try {
            await cancelFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Canceled", description: `Your friend request to ${otherUser.displayName} was canceled.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleAcceptRequest = async () => {
        setIsLoading(true);
        try {
            await acceptFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Friend Added!", description: `You are now friends with ${otherUser.displayName}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }

    const handleDeclineRequest = async () => {
        setIsLoading(true);
        try {
            await declineFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Declined", description: `Friend request from ${otherUser.displayName} declined.`});
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (isFriend) {
        return (
            <Button size="sm" onClick={handleStartChat} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Chat
            </Button>
        );
    }
    
    if (requestReceived) {
        return (
            <div className="flex gap-2">
                <Button size="sm" onClick={handleAcceptRequest} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
                 <Button size="sm" variant="outline" onClick={handleDeclineRequest} disabled={isLoading}>
                    <X className="w-4 h-4"/>
                </Button>
            </div>
        )
    }
    
    if (requestSent) {
        return (
            <Button variant="outline" size="sm" onClick={handleCancelRequest} disabled={isLoading}>
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
                Cancel
            </Button>
        );
    }
    
    return (
        <Button size="sm" onClick={handleAddFriend} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Add Friend
        </Button>
    )

}

export function FindFriendsList() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const [searchQuery, setSearchQuery] = useState('');

    const currentUserDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    const { data: currentUserData, isLoading: isLoadingCurrentUser } = useDoc<FirebaseUser>(currentUserDocRef);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('displayName', 'asc'));
    }, [firestore]);
    
    const { data: users, isLoading: isLoadingUsers } = useCollection<FirebaseUser>(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users || !currentUserData) return [];
        
        const friendIds = new Set(currentUserData.friends || []);

        const otherUsers = users.filter(u => u.id !== currentUser?.uid && !friendIds.has(u.id));

        if (!searchQuery.trim()) return otherUsers;
        
        return otherUsers.filter(user => 
            user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery, currentUser, currentUserData]);

    const isLoading = isLoadingUsers || isLoadingCurrentUser;

    return (
        <div className="space-y-4">
            <div className="relative p-4 border-b border-white/20">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                    placeholder="Search for people..."
                    className="pl-9 bg-white/10 border-none focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <ScrollArea className="h-[350px]">
                {isLoading ? (
                    <ListSkeleton />
                ) : filteredUsers && filteredUsers.length > 0 ? (
                    <div className="space-y-2 p-2">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors animate-fade-in-scale">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={user.photoURL ?? undefined} />
                                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.displayName}</p>
                                        <p className="text-sm text-white/70">{user.year} Year</p>
                                    </div>
                                </div>
                            <ActionButton otherUser={user} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center text-white/50">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-semibold">No users found.</p>
                        <p className="text-sm">Either everyone is your friend, or your search came up empty.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
