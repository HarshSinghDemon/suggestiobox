'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser } from "@/lib/types";
import { useMemo } from "react";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Copy, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

function UserInfoSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="w-full space-y-2 text-center">
                <Skeleton className="w-3/4 h-6 mx-auto" />
                <Skeleton className="w-1/2 h-4 mx-auto" />
            </div>
            <Skeleton className="w-full h-10" />
        </div>
    )
}

export function UserInfoPanel({ roomId }: { roomId: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomId) : null, [firestore, roomId]);
    const { data: room, isLoading: isLoadingRoom } = useDoc<ChatRoom>(roomRef);

    const otherUserId = useMemo(() => room?.participants.find(p => p !== currentUser?.uid), [room, currentUser]);
    
    const otherUserRef = useMemoFirebase(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, isLoading: isLoadingOtherUser } = useDoc<FirebaseUser>(otherUserRef);
    
    const isLoading = isLoadingRoom || isLoadingOtherUser;

    const displayKey = otherUser?.publicKey || 'BwEaRml...key_not_found';

    const copyKeyToClipboard = () => {
        if (displayKey) {
            navigator.clipboard.writeText(displayKey);
            toast({
                title: "Public Key Copied!",
                description: "The user's public key has been copied to your clipboard.",
            });
        }
    };

    if (isLoading) {
        return <UserInfoSkeleton />;
    }
    
    if (!otherUser) {
        return <div className="p-6 text-center text-muted-foreground">User not found.</div>
    }

    return (
        <div className="flex flex-col h-full p-6 bg-transparent border-l border-border">
            <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={otherUser.photoURL ?? undefined} alt={otherUser.displayName ?? ''} />
                    <AvatarFallback className="text-3xl">{getInitials(otherUser.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-xl font-bold">{otherUser.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{otherUser.year} Year</p>
                </div>
            </div>

            <Separator className="my-6" />
            
            <div>
                <h4 className="flex items-center gap-2 mb-2 font-semibold">
                    <KeyRound className="w-4 h-4" />
                    Public Key
                </h4>
                <div className="flex items-center gap-2 p-2 break-all border rounded-md bg-muted">
                    <p className="flex-1 font-mono text-xs text-muted-foreground">{displayKey}</p>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={copyKeyToClipboard}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            
            <Separator className="my-6" />

            <div>
                <h4 className="mb-4 font-semibold">Shared Files</h4>
                <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground border-border">
                    <p>No files shared yet.</p>
                </div>
            </div>
        </div>
    );
}
