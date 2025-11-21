
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

function ChatMessage({ message, onDelete }: { message: Message; onDelete: (messageId: string) => void }) {
    const { user: currentUser } = useUser();
    const isCurrentUserSender = message.senderId === currentUser?.uid;

    // Once the message is rendered, we can consider it "read" and delete it.
    useEffect(() => {
        // Only the recipient should delete the message.
        if (!isCurrentUserSender) {
            onDelete(message.id);
        }
    }, [message.id, isCurrentUserSender, onDelete]);

    return (
        <div className={cn("flex items-end gap-2 max-w-md", isCurrentUserSender ? "self-end" : "self-start")}>
            <div className={cn(
                "p-3 rounded-lg",
                isCurrentUserSender ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p>{message.text}</p>
                 <p className={cn(
                     "text-xs mt-1",
                     isCurrentUserSender ? "text-primary-foreground/70" : "text-muted-foreground"
                 )}>
                    {message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'just now'}
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
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <Skeleton className="w-3/4 h-12" />
                <Skeleton className="self-end w-1/2 h-16" />
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

    const { data: messages } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!currentUser || !messageText.trim() || !firestore) return;
        setIsSending(true);
        const textToSend = messageText.trim();
        setMessageText("");

        try {
            const messagesColRef = collection(firestore, 'chatRooms', roomId, 'messages');
            await addDoc(messagesColRef, {
                roomId: roomId,
                senderId: currentUser.uid,
                text: textToSend,
                createdAt: serverTimestamp(),
            });

            await updateDoc(roomRef!, {
                lastMessage: { text: textToSend, timestamp: serverTimestamp() }
            });
            
             if(otherUser) {
                await addDoc(collection(firestore, 'users', otherUser.id, 'notifications'), {
                    recipientId: otherUser.id,
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName,
                    senderImage: currentUser.photoURL,
                    type: 'private_message',
                    content: 'sent you a message.',
                    relatedId: roomId,
                    relatedLink: `/messages/${roomId}`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessageText(textToSend); // Restore text on error
        } finally {
            setIsSending(false);
        }
    };
    
    const handleDeleteMessage = async (messageId: string) => {
        if (!firestore) return;
        const messageRef = doc(firestore, 'chatRooms', roomId, 'messages', messageId);
        try {
            await deleteDoc(messageRef);
        } catch (error) {
            console.error("Failed to delete message:", error);
        }
    };


    const isLoading = isLoadingRoom || isLoadingOtherUser;
    
    if (isLoading) return <ChatRoomSkeleton />;
    
    if (!room || !otherUser) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <p className="text-lg text-muted-foreground">Chat not found or user does not exist.</p>
                <Button onClick={() => router.push('/messages')}>Go back to messages</Button>
            </div>
        );
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
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {messages && messages.length > 0 ? (
                            messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} onDelete={handleDeleteMessage} />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">
                                No messages yet. Say hello!
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
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        disabled={!currentUser || isSending}
                    />
                    <Button type="submit" size="icon" disabled={!messageText.trim() || !currentUser || isSending}>
                       {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
