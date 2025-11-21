
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message as EncryptedMessage } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Lock, Clock, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { importKey, encryptMessage, decryptMessage, generateAndExportKey } from "@/lib/e2ee";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type DecryptedMessage = {
    id: string;
    senderId: string;
    text: string;
    createdAt: EncryptedMessage['createdAt'] | Date;
    status?: 'sent' | 'pending';
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

function ChatMessage({ message, isCurrentUserSender, author }: { message: DecryptedMessage; isCurrentUserSender: boolean; author?: FirebaseUser }) {
    
    let sentAtDate;
    if (message.createdAt && typeof (message.createdAt as any).toDate === 'function') {
        sentAtDate = (message.createdAt as any).toDate();
    } else if (message.createdAt) {
        sentAtDate = new Date(message.createdAt as any);
    }

    const timeAgo = sentAtDate ? formatDistanceToNow(sentAtDate, { addSuffix: true }) : 'just now';

    return (
        <div className={cn(
            "flex items-end gap-2 max-w-lg w-fit", 
            isCurrentUserSender ? "self-end flex-row-reverse" : "self-start"
        )}>
             <Avatar className={cn("w-8 h-8", isCurrentUserSender && "hidden")}>
                <AvatarImage src={author?.photoURL ?? undefined} />
                <AvatarFallback>{getInitials(author?.displayName)}</AvatarFallback>
            </Avatar>
            <div className={cn(
                "p-3 rounded-2xl relative",
                isCurrentUserSender 
                    ? "bg-primary text-primary-foreground rounded-br-none" 
                    : "bg-muted rounded-bl-none"
            )}>
                <p className="text-sm">{message.text}</p>
                 <div className={cn(
                     "text-xs mt-1.5 flex items-center gap-1.5",
                     isCurrentUserSender ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                 )}>
                    {message.status === 'pending' && <Clock className="w-3 h-3" />}
                    <span>{message.status === 'pending' ? 'Sending...' : timeAgo}</span>
                 </div>
            </div>
        </div>
    );
}

function ChatRoomSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center h-16 gap-4 px-4 border-b shrink-0">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-20 h-3" />
                </div>
            </header>
            <div className="flex-1 p-6 space-y-4">
                <Skeleton className="w-3/4 h-12" />
                <div className="flex justify-end"><Skeleton className="w-1/2 h-16" /></div>
                <Skeleton className="w-3/4 h-8" />
            </div>
            <footer className="p-4 border-t shrink-0">
                <Skeleton className="w-full h-10" />
            </footer>
        </div>
    );
}

export function PrivateChatRoom({ roomId }: { roomId: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
    const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
    const [pendingMessages, setPendingMessages] = useState<DecryptedMessage[]>([]);
    const [keyFingerprint, setKeyFingerprint] = useState<string | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    
    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomId) : null, [firestore, roomId]);
    const { data: room, isLoading: isLoadingRoom } = useDoc<ChatRoom>(roomRef);

    const otherUserId = useMemo(() => room?.participants.find(p => p !== currentUser?.uid), [room, currentUser]);
    const otherUserRef = useMemoFirebase(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, isLoading: isLoadingOtherUser } = useDoc<FirebaseUser>(otherUserRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chatRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, roomId]);

    const { data: encryptedMessages } = useCollection<EncryptedMessage>(messagesQuery);
    
    const calculateFingerprint = async (key: CryptoKey) => {
        const keyData = await window.crypto.subtle.exportKey('raw', key);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setKeyFingerprint(hashHex.substring(0, 10));
    };
    
    const initializeAndSetKey = useCallback(async () => {
        if (!roomRef) return;
        const newKeyB64 = await generateAndExportKey();
        await updateDoc(roomRef, { sessionKey_b64: newKeyB64 });
        const key = await importKey(newKeyB64);
        setSessionKey(key);
        calculateFingerprint(key);
    }, [roomRef]);
    
    useEffect(() => {
        if (isLoadingRoom || !room || !currentUser) return;
        
        if (room.sessionKey_b64 && !sessionKey) {
            importKey(room.sessionKey_b64)
                .then(key => {
                    setSessionKey(key);
                    calculateFingerprint(key);
                })
                .catch(err => {
                    console.error("Failed to import session key, re-creating:", err);
                    initializeAndSetKey();
                });
        } else if (!room.sessionKey_b64) {
            initializeAndSetKey();
        }
    }, [room, isLoadingRoom, sessionKey, currentUser, initializeAndSetKey]);
    
    const processPendingMessages = useCallback(async (key: CryptoKey) => {
        if (pendingMessages.length === 0 || !currentUser || !roomRef) return;
        
        setIsSending(true);
        const messagesToSend = [...pendingMessages];
        setPendingMessages([]);

        for (const msg of messagesToSend) {
            try {
                const { cipherText, iv } = await encryptMessage(key, msg.text);
                const messagesColRef = collection(firestore, 'chatRooms', roomId, 'messages');
                
                await addDoc(messagesColRef, {
                    roomId: roomId,
                    senderId: currentUser.uid,
                    cipherText: cipherText,
                    iv: iv,
                    createdAt: serverTimestamp(),
                });
                
                await updateDoc(roomRef, {
                    lastMessage: { text: 'Encrypted message', timestamp: serverTimestamp() }
                });
            } catch (error) {
                console.error("Failed to send a pending message:", error);
            }
        }
        setIsSending(false);
    }, [pendingMessages, currentUser, firestore, roomId, roomRef]);

    useEffect(() => {
        if (sessionKey && pendingMessages.length > 0) {
            processPendingMessages(sessionKey);
        }
    }, [sessionKey, pendingMessages, processPendingMessages]);

    useEffect(() => {
        if (!sessionKey || !encryptedMessages) {
            setDecryptedMessages([]);
            return;
        };

        const decryptAll = async () => {
            const newDecryptedMessages: DecryptedMessage[] = await Promise.all(
                encryptedMessages.map(async (msg) => {
                    try {
                        const decryptedText = await decryptMessage(sessionKey, msg.cipherText, msg.iv);
                        return { ...msg, text: decryptedText, status: 'sent' };
                    } catch (e) {
                        return { ...msg, text: "Failed to decrypt message.", status: 'sent' };
                    }
                })
            );
            setDecryptedMessages(newDecryptedMessages);
        };
        decryptAll();
    }, [sessionKey, encryptedMessages]);
    
    const allMessages = useMemo(() => [...decryptedMessages, ...pendingMessages], [decryptedMessages, pendingMessages]);
    
    useEffect(() => {
        if (viewportRef.current) {
            setTimeout(() => {
                 viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'auto' });
            }, 100);
        }
    }, [allMessages]);

    const handleSendMessage = async () => {
        if (!currentUser || !messageText.trim()) return;
        
        const textToSend = messageText.trim();
        setMessageText("");

        const pendingMsg: DecryptedMessage = {
            id: `pending-${Date.now()}`,
            senderId: currentUser.uid,
            text: textToSend,
            createdAt: new Date(),
            status: 'pending'
        };

        setPendingMessages(prev => [...prev, pendingMsg]);
    };

    const isLoading = isLoadingRoom || isLoadingOtherUser;
    
    if (isLoading) return <ChatRoomSkeleton />;
    
    if (!room || !otherUser) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <p className="text-lg text-muted-foreground">Chat not found.</p>
                <Button onClick={() => router.push('/messages')}>Go back to messages</Button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-card">
            <header className="flex items-center h-16 gap-3 px-4 border-b shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/messages')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                    <AvatarImage src={otherUser.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold">{otherUser.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                        {otherUser.year} Year
                    </p>
                </div>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Lock className={cn("w-5 h-5", sessionKey ? 'text-green-500' : 'text-amber-500 animate-pulse')} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Messages are end-to-end encrypted.</p>
                        {keyFingerprint && <p className="mt-1 font-mono text-xs text-muted-foreground">Fingerprint: {keyFingerprint}</p>}
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Info className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>This is a private chat.</p>
                        <p className="text-xs text-muted-foreground">Only you and {otherUser.displayName} can see these messages.</p>
                    </TooltipContent>
                </Tooltip>
            </header>
            <div className="flex-1 min-h-0 overflow-hidden">
                 <ScrollArea className="h-full" viewportRef={viewportRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {allMessages.length > 0 ? (
                            allMessages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} isCurrentUserSender={msg.senderId === currentUser?.uid} author={otherUser} />
                            ))
                        ) : (
                            <p className="py-12 text-sm text-center text-muted-foreground">
                                No messages yet. Say hello!
                            </p>
                        )}
                         {!sessionKey && (
                            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin"/>
                                <p>Establishing secure connection...</p>
                            </div>
                         )}
                    </div>
                </ScrollArea>
            </div>
            <footer className="p-4 border-t shrink-0">
                <form
                    className="flex w-full gap-2"
                    onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
                >
                    <Input 
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        disabled={!currentUser}
                        className="text-base"
                    />
                    <Button type="submit" size="icon" disabled={!messageText.trim() || !currentUser || isSending}>
                       {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}
