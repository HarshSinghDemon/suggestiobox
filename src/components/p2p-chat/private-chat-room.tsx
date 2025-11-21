
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc, getDoc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Lock, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getMyPrivateKey, decryptMessage, encryptMessage as encryptWithSessionKey } from "@/lib/e2ee";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

type OptimisticMessage = Message & { isSending?: boolean; text?: string };

function ChatMessage({ message, sessionKey }: { message: OptimisticMessage; sessionKey: CryptoKey | null }) {
    const { user: currentUser } = useUser();
    const [decryptedText, setDecryptedText] = useState('...');
    
    useEffect(() => {
        const decrypt = async () => {
            if (message.isSending && message.text) {
                setDecryptedText(message.text);
                return;
            }
            if (sessionKey && message.cipherText && message.iv) {
                try {
                    const text = await decryptMessage(sessionKey, message.cipherText, message.iv);
                    setDecryptedText(text);
                } catch (e) {
                    console.error("Decryption failed:", e);
                    setDecryptedText("⚠️ Failed to decrypt");
                }
            }
        };
        decrypt();
    }, [message, sessionKey]);
    
    const isCurrentUserSender = message.senderId === currentUser?.uid;

    return (
        <div className={cn("flex items-end gap-2 max-w-md", isCurrentUserSender ? "self-end" : "self-start")}>
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
                    <Skeleton className="w-48 h-4" />
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
    
    const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
    const [sessionFingerprint, setSessionFingerprint] = useState<string | null>(null);

    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomId) : null, [firestore, roomId]);
    const { data: room, isLoading: isLoadingRoom } = useDoc<ChatRoom>(roomRef);

    const otherUserId = useMemo(() => room?.participants.find(p => p !== currentUser?.uid), [room, currentUser]);
    const otherUserRef = useMemoFirebase(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, isLoading: isLoadingOtherUser } = useDoc<FirebaseUser>(otherUserRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chatRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, roomId]);

    const { data: dbMessages } = useCollection<Message>(messagesQuery);
    
    // Decrypt session key
    useEffect(() => {
        const decryptSessionKey = async () => {
            if (room && currentUser && room.sessionKeys && room.sessionKeys[currentUser.uid] && !sessionKey) {
                try {
                    const myPrivateKey = await getMyPrivateKey();
                    if (!myPrivateKey) {
                        toast({ variant: 'destructive', title: 'Encryption Error', description: 'Could not load your private key. Please log out and back in.' });
                        return;
                    }
                    const encryptedKeyData = room.sessionKeys[currentUser.uid];
                    const decryptedJwk = await decryptMessage(myPrivateKey, encryptedKeyData.key, encryptedKeyData.iv, true);
                    const key = await window.crypto.subtle.importKey(
                        'jwk',
                        JSON.parse(decryptedJwk),
                        { name: "AES-GCM", length: 256 },
                        true,
                        ["encrypt", "decrypt"]
                    );
                    setSessionKey(key);
                    
                    // Generate fingerprint
                    const keyData = await window.crypto.subtle.exportKey('raw', key);
                    const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyData);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    setSessionFingerprint(hashHex.substring(0, 10));

                } catch (e) {
                    console.error("Failed to decrypt session key:", e);
                    toast({ variant: 'destructive', title: 'Security Error', description: 'Could not establish secure session. The chat may be compromised.'});
                }
            }
        };
        decryptSessionKey();
    }, [room, currentUser, sessionKey, toast]);


    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [dbMessages]);

    const handleSendMessage = async () => {
        if (!currentUser || !firestore || !messageText.trim()) {
            return;
        }
        
        if (!sessionKey) {
             toast({ variant: 'destructive', title: 'Not Ready', description: 'Secure session is not yet established. Please wait.'});
             return;
        }

        const textToSend = messageText.trim();
        setMessageText("");
        
        try {
            const { cipherText, iv } = await encryptWithSessionKey(sessionKey, textToSend, false);
            const messagesColRef = collection(firestore, 'chatRooms', roomId, 'messages');
            
            await addDoc(messagesColRef, {
                senderId: currentUser.uid,
                cipherText,
                iv,
                createdAt: serverTimestamp(),
            });
            
            await updateDoc(roomRef!, {
                lastMessage: { text: '🔒 Encrypted message', timestamp: serverTimestamp() }
            });
            
            if(otherUser) {
                const notificationPromise = addDoc(collection(firestore, 'users', otherUser.id, 'notifications'), {
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
                await notificationPromise;
            }

        } catch (error) {
            console.error("Failed to send message:", error);
            toast({ variant: 'destructive', title: 'Send Failed', description: 'Could not encrypt and send your message.' });
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
                    {sessionFingerprint && (
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 text-xs text-green-500 cursor-pointer">
                                    <Lock className="w-3 h-3" />
                                    <span>Encrypted</span>
                                    <Hash className="w-3 h-3" />
                                    <span className="font-mono">{sessionFingerprint}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This chat is end-to-end encrypted. <br/> The session fingerprint is a unique identifier for this secure conversation.</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {dbMessages && dbMessages.length > 0 ? (
                            dbMessages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} sessionKey={sessionKey} />
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
                    <Button type="submit" size="icon" disabled={!messageText.trim() || !currentUser || !sessionKey}>
                        <Send />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
