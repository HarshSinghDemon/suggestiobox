
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message as EncryptedMessage, Reaction, Reply } from "@/lib/types";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Lock, Info, Smile, MessageSquareQuote, Check, CheckCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { importKey, encryptMessage, decryptMessage, generateAndExportKey } from "@/lib/e2ee";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { useDebounce } from 'use-debounce';

type DecryptedMessage = {
    id: string;
    senderId: string;
    text: string;
    createdAt: EncryptedMessage['createdAt'] | Date;
    status?: 'sent' | 'pending';
    reactions?: Reaction[];
    replyTo?: Reply | null;
    isRead?: boolean;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

const ReactionPicker = ({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void; }) => {
    const reactions = ['❤️', '👍', '😂', '😢', '😮', '🙏'];
    return (
        <div className="flex gap-1 p-1 bg-background border rounded-full shadow-md">
            {reactions.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className="p-1.5 text-lg rounded-full hover:bg-accent transition-transform hover:scale-125"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};


function ChatMessage({ message, isCurrentUserSender, author, onReply, onReact }: { message: DecryptedMessage; isCurrentUserSender: boolean; author?: FirebaseUser; onReply: (message: DecryptedMessage) => void; onReact: (messageId: string, emoji: string) => void; }) {
    const [showActions, setShowActions] = useState(false);
    
    let sentAtDate;
    if (message.createdAt && typeof (message.createdAt as any).toDate === 'function') {
        sentAtDate = (message.createdAt as any).toDate();
    } else if (message.createdAt) {
        sentAtDate = new Date(message.createdAt as any);
    }

    const timeAgo = sentAtDate ? formatDistanceToNow(sentAtDate, { addSuffix: true }) : 'just now';

    const groupedReactions = message.reactions?.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.userName);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div 
            className={cn("flex items-end gap-2 max-w-lg w-fit group", isCurrentUserSender ? "self-end flex-row-reverse" : "self-start")}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
             <Avatar className={cn("w-8 h-8", isCurrentUserSender && "hidden")}>
                <AvatarImage src={author?.photoURL ?? undefined} />
                <AvatarFallback>{getInitials(author?.displayName)}</AvatarFallback>
            </Avatar>
            
            <div className="relative">
                {message.replyTo && (
                    <div className={cn(
                        "p-2 text-xs rounded-t-lg bg-black/10 dark:bg-white/5 border-b border-black/20 dark:border-white/10",
                        isCurrentUserSender ? 'ml-4' : 'mr-4'
                    )}>
                        <p className="font-semibold text-primary">{message.replyTo.senderName}</p>
                        <p className="truncate text-muted-foreground">{message.replyTo.text}</p>
                    </div>
                )}
                <div className={cn(
                    "p-3 relative",
                    isCurrentUserSender 
                        ? "bg-primary text-primary-foreground rounded-l-2xl rounded-tr-2xl" 
                        : "bg-muted rounded-r-2xl rounded-tl-2xl",
                    message.replyTo && (isCurrentUserSender ? "rounded-bl-2xl" : "rounded-br-2xl")
                )}>
                    <p className="text-sm">{message.text}</p>
                    <div className={cn(
                        "text-xs mt-1.5 flex items-center gap-1.5",
                        isCurrentUserSender ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                    )}>
                        <span>{timeAgo}</span>
                        {isCurrentUserSender && message.status !== 'pending' && (
                             message.isRead ? <CheckCheck className="w-4 h-4 text-blue-400"/> : <Check className="w-4 h-4" />
                        )}
                    </div>
                </div>
                {groupedReactions && Object.keys(groupedReactions).length > 0 && (
                     <div className={cn("absolute -bottom-3 flex gap-1", isCurrentUserSender ? "right-2" : "left-2")}>
                        {Object.entries(groupedReactions).map(([emoji, users]) => (
                            <Tooltip key={emoji}>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center px-1.5 py-0.5 text-xs bg-background border rounded-full cursor-default shadow-sm">
                                        <span>{emoji}</span>
                                        <span className="ml-1 font-bold">{users.length}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{users.join(', ')}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                )}
            </div>

             <div className={cn("flex items-center gap-1 transition-opacity", showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7"><Smile className="w-4 h-4"/></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <ReactionPicker onClose={() => {}} onSelect={(emoji) => onReact(message.id, emoji)} />
                    </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onReply(message)}><MessageSquareQuote className="w-4 h-4"/></Button>
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
    const [replyingTo, setReplyingTo] = useState<DecryptedMessage | null>(null);
    
    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomId) : null, [firestore, roomId]);
    const { data: room, isLoading: isLoadingRoom } = useDoc<ChatRoom>(roomRef);

    const otherUserId = useMemo(() => room?.participants.find(p => p !== currentUser?.uid), [room, currentUser]);
    const isTyping = room?.typing?.[otherUserId || ''] ?? false;
    
    const otherUserRef = useMemoFirebase(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, isLoading: isLoadingOtherUser } = useDoc<FirebaseUser>(otherUserRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chatRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, roomId]);

    const { data: encryptedMessages } = useCollection<EncryptedMessage>(messagesQuery);
    
    // --- Typing Indicator Logic ---
    const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);
    const [debouncedTyping] = useDebounce(isCurrentlyTyping, 2000); // 2-second debounce time

    const handleTyping = (text: string) => {
        setMessageText(text);
        if (!isCurrentlyTyping && roomRef && currentUser) {
            setIsCurrentlyTyping(true);
            updateDoc(roomRef, { [`typing.${currentUser.uid}`]: true });
        }
    };
    
    useEffect(() => {
        if (!isCurrentlyTyping) return;
        if (debouncedTyping === false && roomRef && currentUser) {
             updateDoc(roomRef, { [`typing.${currentUser.uid}`]: false });
             setIsCurrentlyTyping(false);
        }
    }, [debouncedTyping, isCurrentlyTyping, roomRef, currentUser]);
    
    
    // --- Read Receipt Logic ---
    useEffect(() => {
        if (!currentUser || !roomRef || !encryptedMessages || encryptedMessages.length === 0) return;
        
        const lastMessage = encryptedMessages[encryptedMessages.length - 1];
        
        // If the last message is from the other user and is not marked as read by the current user
        const lastReadTimestamp = room?.lastRead?.[currentUser.uid];
        if (lastMessage.senderId !== currentUser.uid && (!lastReadTimestamp || lastMessage.createdAt > lastReadTimestamp)) {
             updateDoc(roomRef, { [`lastRead.${currentUser.uid}`]: serverTimestamp() });
        }
    }, [encryptedMessages, currentUser, roomRef, room]);


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
        await calculateFingerprint(key);
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
                
                const replyData = msg.replyTo ? {
                    replyTo: {
                        messageId: msg.replyTo.messageId,
                        text: msg.replyTo.text,
                        senderName: msg.replyTo.senderName,
                    }
                } : {};
                
                await addDoc(messagesColRef, {
                    roomId: roomId,
                    senderId: currentUser.uid,
                    cipherText: cipherText,
                    iv: iv,
                    createdAt: serverTimestamp(),
                    reactions: [],
                    ...replyData,
                });
                
                await updateDoc(roomRef, {
                    lastMessage: { text: 'Encrypted message', timestamp: serverTimestamp(), senderId: currentUser.uid }
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
            const lastReadByOtherUser = room?.lastRead?.[otherUserId!];
            const newDecryptedMessages: DecryptedMessage[] = await Promise.all(
                encryptedMessages.map(async (msg) => {
                    try {
                        const decryptedText = await decryptMessage(sessionKey, msg.cipherText, msg.iv);
                        const isRead = msg.senderId === currentUser?.uid && lastReadByOtherUser && msg.createdAt <= lastReadByOtherUser;
                        return { ...msg, text: decryptedText, status: 'sent', isRead: !!isRead };
                    } catch (e) {
                        return { ...msg, text: "Failed to decrypt message.", status: 'sent' };
                    }
                })
            );
            setDecryptedMessages(newDecryptedMessages);
        };
        decryptAll();
    }, [sessionKey, encryptedMessages, room, otherUserId, currentUser?.uid]);
    
    const allMessages = useMemo(() => [...decryptedMessages, ...pendingMessages], [decryptedMessages, pendingMessages]);
    
    useLayoutEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [allMessages]);

    const handleSendMessage = async () => {
        if (!currentUser || !messageText.trim() || !roomRef) return;
        
        const textToSend = messageText.trim();
        setMessageText("");
        setIsCurrentlyTyping(false); // Stop typing status on send
        updateDoc(roomRef, { [`typing.${currentUser.uid}`]: false });

        const pendingMsg: DecryptedMessage = {
            id: `pending-${Date.now()}`,
            senderId: currentUser.uid,
            text: textToSend,
            createdAt: new Date(),
            status: 'pending',
            replyTo: replyingTo ? {
                messageId: replyingTo.id,
                text: replyingTo.text,
                senderName: replyingTo.senderId === currentUser.uid ? 'You' : otherUser?.displayName || 'Them'
            } : null
        };
        
        setReplyingTo(null);
        setPendingMessages(prev => [...prev, pendingMsg]);
    };
    
    const handleReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!currentUser || !firestore) return;
        const messageRef = doc(firestore, 'chatRooms', roomId, 'messages', messageId);
        
        const existingReaction = decryptedMessages.find(m => m.id === messageId)?.reactions?.find(r => r.userId === currentUser.uid && r.emoji === emoji);

        if (existingReaction) {
            await updateDoc(messageRef, { reactions: arrayRemove(existingReaction) });
        } else {
            const newReaction: Reaction = { emoji, userId: currentUser.uid, userName: currentUser.displayName || 'User' };
            await updateDoc(messageRef, { reactions: arrayUnion(newReaction) });
        }
    }, [currentUser, firestore, roomId, decryptedMessages]);

    const handleReply = useCallback((message: DecryptedMessage) => {
        setReplyingTo(message);
    }, []);


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
        <div className="flex flex-col h-full bg-transparent">
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
                        {isTyping ? <span className="italic text-primary">typing...</span> : `Year: ${otherUser.year}`}
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
            <ScrollArea className="flex-1 min-h-0" viewportRef={viewportRef}>
                <div className="flex flex-col gap-4 p-6">
                    {!sessionKey && (
                        <div className="flex items-center justify-center gap-2 p-4 text-sm rounded-md text-muted-foreground bg-muted">
                            <Loader2 className="w-4 h-4 animate-spin"/>
                            <p>Establishing secure connection...</p>
                        </div>
                    )}
                    {allMessages.length > 0 ? (
                        allMessages.map(msg => (
                            <ChatMessage key={msg.id} message={msg} isCurrentUserSender={msg.senderId === currentUser?.uid} author={otherUser} onReply={handleReply} onReact={handleReaction} />
                        ))
                    ) : (
                         <div className="flex items-center justify-center gap-2 p-4 my-8 text-sm text-center rounded-md text-muted-foreground bg-muted">
                            <Lock className="w-4 h-4 shrink-0" />
                            <p>Messages are end-to-end encrypted. No one outside of this chat, not even The Suggestion Box, can read them.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <footer className="p-2 border-t shrink-0 sm:p-4 bg-muted/50 rounded-b-xl">
                {replyingTo && (
                    <div className="flex items-center justify-between p-2 mb-2 rounded-md bg-background/50">
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-primary">Replying to {replyingTo.senderId === currentUser?.uid ? "yourself" : otherUser.displayName}</p>
                            <p className="text-sm truncate text-muted-foreground">{replyingTo.text}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}><X className="w-4 h-4"/></Button>
                    </div>
                )}
                <form
                    className="flex w-full gap-2"
                    onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
                >
                    <Input 
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={e => handleTyping(e.target.value)}
                        disabled={!currentUser || !sessionKey}
                        className="text-base bg-background/50"
                    />
                    <Button type="submit" size="icon" disabled={!messageText.trim() || !currentUser || isSending || !sessionKey} className="rounded-full w-10 h-10">
                       {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}
