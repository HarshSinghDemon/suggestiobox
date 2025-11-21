
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};


function ChatMessage({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
    // In a real E2EE app, you would decrypt message.cipherText here
    const messageText = message.cipherText; 
    
    return (
        <div className={cn("flex items-end gap-2 max-w-md", isOwnMessage ? "self-end" : "self-start")}>
            {!isOwnMessage && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src={message.userImage ?? undefined} />
                    <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "p-3 rounded-lg",
                isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p>{messageText}</p>
                 <p className={cn(
                     "text-xs mt-1",
                     isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                 )}>
                    {formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}


function ChatRoomSkeleton() {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="w-32 h-6" />
                    <Skeleton className="w-20 h-4" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <Skeleton className="w-3/4 h-12" />
                <Skeleton className="w-1/2 h-16 self-end" />
                <Skeleton className="w-3/4 h-8" />
            </CardContent>
            <CardFooter>
                <Skeleton className="w-full h-10" />
            </CardFooter>
        </Card>
    );
}

export function PrivateChatRoom({ roomId }: { roomId: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomId) : null, [firestore, roomId]);
    const { data: room, isLoading: isLoadingRoom } = useDoc<ChatRoom>(roomRef);

    const otherUserId = useMemo(() => room?.participants.find(p => p !== currentUser?.uid), [room, currentUser]);
    const otherUserRef = useMemoFirebase(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, isLoading: isLoadingOtherUser } = useDoc<FirebaseUser>(otherUserRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chatRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, roomId]);

    const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!currentUser || !firestore || !messageText.trim()) return;
        
        setIsSending(true);

        const messageData = {
            roomId,
            senderId: currentUser.uid,
            // In a real E2EE app, you would encrypt the message here before sending
            cipherText: messageText.trim(),
            createdAt: serverTimestamp(),
            userName: currentUser.displayName,
            userImage: currentUser.photoURL,
        };

        try {
            const messagesColRef = collection(firestore, 'chatRooms', roomId, 'messages');
            await addDoc(messagesColRef, messageData);
            
            // Also update the lastMessage on the chatRoom for list view
            await updateDoc(roomRef!, {
                lastMessage: {
                    text: messageText.trim(),
                    timestamp: serverTimestamp()
                }
            });

            setMessageText("");
        } catch(error) {
            console.error("Failed to send message:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not send message." });
        } finally {
            setIsSending(false);
        }
    };


    const isLoading = isLoadingRoom || isLoadingOtherUser;
    
    if (isLoading) return <ChatRoomSkeleton />;
    
    if (!room || !otherUser) {
        return <p>Chat not found.</p>
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-4 border-b">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push('/messages')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-12 h-12">
                    <AvatarImage src={otherUser.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{otherUser.displayName}</CardTitle>
                    <CardDescription>{otherUser.email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {isLoadingMessages ? (
                            <Loader2 className="m-auto animate-spin" />
                        ) : messages && messages.length > 0 ? (
                            messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} isOwnMessage={msg.senderId === currentUser?.uid} />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">
                                This is the beginning of your conversation. Send a message to start.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <form
                    className="flex w-full gap-2"
                    onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
                >
                    <Input 
                        placeholder="Type your message..." 
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        disabled={isSending}
                    />
                    <Button type="submit" size="icon" disabled={isSending || !messageText.trim()}>
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
