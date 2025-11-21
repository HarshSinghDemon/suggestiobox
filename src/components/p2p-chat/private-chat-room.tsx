
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { deriveSharedKey, encryptMessage, decryptMessage, getMyPrivateKey } from "@/lib/e2ee";

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

// Represents a message that is either still being encrypted and sent, or has been sent.
type OptimisticMessage = Message & { isSending?: boolean; id: string; text?: string };

function ChatMessage({ message, sharedKey }: { message: OptimisticMessage; sharedKey: CryptoKey | null }) {
    const { user: currentUser } = useUser();
    const [decryptedText, setDecryptedText] = useState('...');
    
    useEffect(() => {
        const decrypt = async () => {
            // If it's an optimistic message that hasn't been encrypted yet, show its text directly.
            if (message.isSending && message.text) {
                setDecryptedText(message.text);
                return;
            }
            
            if (sharedKey && message.cipherText && message.iv) {
                try {
                    const text = await decryptMessage(sharedKey, message.cipherText, message.iv);
                    setDecryptedText(text);
                } catch (e) {
                    console.error("Decryption failed:", e);
                    setDecryptedText("⚠️ Failed to decrypt");
                }
            } else if (message.text) { // Fallback for old plaintext or optimistic messages
                 setDecryptedText(message.text);
            }
        };
        decrypt();
    }, [message, sharedKey]);
    
    const isCurrentUserSender = message.senderId === currentUser?.uid;

    return (
        <div className={cn("flex items-end gap-2 max-w-md", isCurrentUserSender ? "self-end" : "self-start")}>
            {!isCurrentUserSender && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src={message.userImage ?? undefined} />
                    <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "p-3 rounded-lg",
                isCurrentUserSender ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p>{decryptedText}</p>
                 <p className={cn(
                     "text-xs mt-1",
                     isCurrentUserSender ? "text-primary-foreground/70" : "text-muted-foreground"
                 )}>
                    {message.isSending ? 'sending...' : message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'just now'}
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
    const { toast } = useToast();
    const [messageText, setMessageText] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    // Non-blocking E2EE state
    const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
    const messageQueue = useRef<OptimisticMessage[]>([]);
    const isProcessingQueue = useRef(false);

    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomId) : null, [firestore, roomId]);
    const { data: room, isLoading: isLoadingRoom } = useDoc<ChatRoom>(roomRef);

    const otherUserId = useMemo(() => room?.participants.find(p => p !== currentUser?.uid), [room, currentUser]);
    const otherUserRef = useMemoFirebase(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, isLoading: isLoadingOtherUser } = useDoc<FirebaseUser>(otherUserRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chatRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, roomId]);

    const { data: dbMessages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
    
    // This state holds both confirmed and optimistic messages
    const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

    useEffect(() => {
        if (dbMessages) {
            setOptimisticMessages(dbMessages);
        }
    }, [dbMessages]);


    const processMessageQueue = useCallback(async (key: CryptoKey) => {
        if (isProcessingQueue.current || messageQueue.current.length === 0) return;
        isProcessingQueue.current = true;

        const messagesToSend = [...messageQueue.current];
        messageQueue.current = [];

        for (const msg of messagesToSend) {
            try {
                if (!msg.text) continue;
                const { cipherText, iv } = await encryptMessage(key, msg.text);
                
                const messageData = {
                    roomId,
                    senderId: currentUser!.uid,
                    cipherText, iv,
                    createdAt: serverTimestamp(),
                    userName: currentUser!.displayName, userImage: currentUser!.photoURL,
                };

                const messagesColRef = collection(firestore!, 'chatRooms', roomId, 'messages');
                const updateLastMessagePromise = updateDoc(roomRef!, {
                    lastMessage: { text: '🔒 Encrypted message', timestamp: serverTimestamp() }
                });
                
                const notificationPromise = addDoc(collection(firestore!, 'users', otherUser!.id, 'notifications'), {
                    recipientId: otherUser!.id,
                    senderId: currentUser!.uid,
                    senderName: currentUser!.displayName,
                    senderImage: currentUser!.photoURL,
                    type: 'private_message',
                    content: 'sent you a message.',
                    relatedId: roomId,
                    relatedLink: `/messages/${roomId}`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });

                await Promise.all([
                    addDoc(messagesColRef, messageData),
                    updateLastMessagePromise,
                    notificationPromise
                ]);

            } catch (error) {
                console.error("Failed to send queued message:", error);
                // Optionally, add the message back to the queue or mark it as failed in the UI
            }
        }

        isProcessingQueue.current = false;
    }, [currentUser, firestore, roomId, roomRef, otherUser]);

    useEffect(() => {
        const deriveAndProcessKey = async () => {
            if (otherUser?.publicKey && !sharedKey) {
                try {
                    const privateKey = await getMyPrivateKey();
                    if (!privateKey) {
                         console.log("Waiting for private key to become available...");
                         return; // Wait for key generation
                    }
                    const key = await deriveSharedKey(privateKey, otherUser.publicKey);
                    setSharedKey(key);
                    await processMessageQueue(key);
                } catch (e) {
                    console.error("Key derivation failed", e);
                    toast({ variant: 'destructive', title: 'Encryption Error', description: 'Could not establish a secure session. Please try again later.' });
                }
            } else if (sharedKey) {
                await processMessageQueue(sharedKey);
            }
        };
        deriveAndProcessKey();
    }, [otherUser, sharedKey, processMessageQueue, toast]);


    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [optimisticMessages]);

    const handleSendMessage = async () => {
        if (!currentUser || !firestore || !otherUser || !messageText.trim()) return;

        const textToSend = messageText.trim();
        setMessageText("");
        
        // Optimistically update UI
        const optimisticMsg: OptimisticMessage = {
            id: `local-${Date.now()}`,
            roomId,
            senderId: currentUser.uid,
            text: textToSend, // Keep plaintext for optimistic display and later encryption
            cipherText: '', // Will be filled later
            iv: '',         // Will be filled later
            isSending: true,
            createdAt: new Date() as any, // Temporary timestamp
            userName: currentUser.displayName,
            userImage: currentUser.photoURL,
        };

        setOptimisticMessages(prev => [...prev, optimisticMsg]);
        messageQueue.current.push(optimisticMsg);

        // Trigger background processing
        if (sharedKey) {
            processMessageQueue(sharedKey);
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
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs",
                        sharedKey ? "text-green-500" : "text-amber-500 animate-pulse"
                    )}>
                        <Lock className="w-3 h-3" />
                        <span>Signal-Grade End-to-End Encryption (X25519 + AES-256-GCM)</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {isLoadingMessages && optimisticMessages.length === 0 ? (
                            <Loader2 className="m-auto animate-spin" />
                        ) : optimisticMessages && optimisticMessages.length > 0 ? (
                            optimisticMessages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} sharedKey={sharedKey} />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">
                                This is the beginning of your encrypted conversation.
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
                        placeholder="Type an encrypted message..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        disabled={!currentUser}
                    />
                    <Button type="submit" size="icon" disabled={!messageText.trim() || !currentUser}>
                        {isProcessingQueue.current ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
