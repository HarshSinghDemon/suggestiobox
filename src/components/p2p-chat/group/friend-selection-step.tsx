
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import type { FirebaseUser } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface FriendSelectionStepProps {
    onSelectionChange: (selected: FirebaseUser[]) => void;
    initialSelection: FirebaseUser[];
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

export function FriendSelectionStep({ onSelectionChange, initialSelection }: FriendSelectionStepProps) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set(initialSelection.map(f => f.id)));
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
        return friends.filter(friend => friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [friends, searchQuery]);

    useEffect(() => {
        if (friends) {
            const selected = friends.filter(friend => selectedFriendIds.has(friend.id));
            onSelectionChange(selected);
        }
    }, [selectedFriendIds, friends, onSelectionChange]);

    const handleSelectFriend = (friendId: string) => {
        const newSelection = new Set(selectedFriendIds);
        if (newSelection.has(friendId)) {
            newSelection.delete(friendId);
        } else {
            newSelection.add(friendId);
        }
        setSelectedFriendIds(newSelection);
    };

    const isLoading = isLoadingCurrentUser || (friendIds.length > 0 && isLoadingFriends);

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-bold">Select Friends to Add</h3>
            <p className="text-white/70 mb-4">Choose who you want to invite to this group.</p>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/10 border-white/20 focus-visible:ring-purple-400"
                />
            </div>
            <div className="flex-1 min-h-0 -mr-4">
                <ScrollArea className="h-full pr-4">
                    {isLoading && (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-16 rounded-lg" />)}
                        </div>
                    )}
                    {!isLoading && filteredFriends.length > 0 && (
                        <div className="space-y-2">
                            {filteredFriends.map(friend => (
                                <div
                                    key={friend.id}
                                    className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                                    onClick={() => handleSelectFriend(friend.id)}
                                >
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={friend.photoURL ?? undefined} />
                                        <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{friend.displayName}</p>
                                        <p className="text-sm text-white/70">{friend.year} Year</p>
                                    </div>
                                    <Checkbox
                                        checked={selectedFriendIds.has(friend.id)}
                                        onCheckedChange={() => handleSelectFriend(friend.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                     {!isLoading && filteredFriends.length === 0 && (
                        <div className="py-16 text-center text-white/50">
                            <p>No friends found.</p>
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
