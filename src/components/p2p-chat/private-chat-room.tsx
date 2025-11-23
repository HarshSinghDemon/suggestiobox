
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message as EncryptedMessage, Reaction } from "@/lib/types";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Lock, MoreVertical, Smile, Paperclip, Check, CheckCheck, X, Download, File, ImageIcon, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { importKey, decryptMessage, encryptBuffer } from "@/lib/e2ee";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { useDebounce } from 'use-debounce';
import { useImageKit } from "@/lib/imagekit/imagekit-provider";
import Image from "next/image";
import Markdown from "react-markdown";

type DecryptedMessage = {
    id: string;
    senderId: string;
    text: string;
    iv?: string;
    createdAt: EncryptedMessage['createdAt'] | Date;
    status?: 'sent' | 'pending';
    reactions?: Reaction[];
    isRead?: boolean;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
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

async function downloadAndDecryptFile(fileUrl: string, fileType: string, fileName: string, sessionKey: CryptoKey, ivB64: string) {
    try {
        const response = await fetch(fileUrl);
        const encryptedBlob = await response.blob();
        const encryptedBuffer = await encryptedBlob.arrayBuffer();

        const decryptedBuffer = await decryptMessage(sessionKey, btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))), ivB64);

        const decryptedBlob = new Blob([new TextEncoder().encode(decryptedBuffer)], { type: fileType });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(decryptedBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Failed to download or decrypt file:", e);
    }
}


function ChatMessage({ message, isCurrentUserSender, author, onReact, sessionKey }: { message: DecryptedMessage; isCurrentUserSender: boolean; author?: FirebaseUser; onReact: (messageId: string, emoji: string) => void; sessionKey: CryptoKey | null }) {
    const [showActions, setShowActions] = useState(false);
    
    let sentAtDate;
    if (message.createdAt && typeof (message.createdAt as any).toDate === 'function') {
        sentAtDate = (message.createdAt as any).toDate();
    } else if (message.createdAt) {
        sentAtDate = new Date(message.createdAt as any);
    }

    const timeAgo = sentAtDate ? sentAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';
    
    const handleDownload = () => {
        if (message.fileUrl && message.fileName && message.iv && sessionKey) {
            downloadAndDecryptFile(message.fileUrl, message.fileType || 'application/octet-stream', message.fileName, sessionKey, message.iv);
        }
    };

    return (
        <div 
            className={cn(
                "flex items-end gap-2 w-full group animate-fade-in-up", 
                isCurrentUserSender ? "self-end flex-row-reverse" : "self-start"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
             {!isCurrentUserSender && (
                 <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={author?.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(author?.displayName)}</AvatarFallback>
                </Avatar>
             )}
            
            <div className={cn("relative p-3 rounded-2xl max-w-[75%]", 
              isCurrentUserSender 
                ? "bg-gradient-to-br from-primary to-purple-500 text-white rounded-br-none" 
                : "glass-pane rounded-bl-none border-none")}>
                {message.fileUrl && (
                    <div className="mb-2">
                         <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer" onClick={handleDownload}>
                                <Download className="w-8 h-8"/>
                                <div>
                                    <p className="font-semibold break-words">{message.fileName}</p>
                                    <p className="text-xs">Click to download encrypted file</p>
                                </div>
                            </div>
                    </div>
                )}
                {message.text && <p className="font-chat text-sm break-words">{message.text}</p>}
                 <div className={cn(
                    "text-xs mt-1.5 flex items-center gap-1.5",
                    isCurrentUserSender ? "text-white/70 justify-end" : "text-white/70"
                )}>
                    <span>{timeAgo}</span>
                    {isCurrentUserSender && message.status !== 'pending' && (
                         message.isRead ? <CheckCheck className="w-4 h-4 text-blue-400"/> : <Check className="w-4 h-4" />
                    )}
                </div>
            </div>
             <div className={cn("flex items-center gap-1 transition-opacity shrink-0", showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7"><Smile className="w-4 h-4"/></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <ReactionPicker onClose={() => {}} onSelect={(emoji) => onReact(message.id, emoji)} />
                    </PopoverContent>
                </Popover>
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

export function PrivateChatRoom({ roomId, onToggleInfoPanel }: { roomId: string, onToggleInfoPanel: () => void; }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
    const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
    const [pendingMessages, setPendingMessages] = useState<DecryptedMessage[]>([]);
    const viewportRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload } = useImageKit();
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    
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
    
    const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);
    const [debouncedTyping] = useDebounce(isCurrentlyTyping, 2000);

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
    
    useEffect(() => {
        if (!currentUser || !roomRef || !encryptedMessages || encryptedMessages.length === 0) return;
        const lastMessage = encryptedMessages[encryptedMessages.length - 1];
        const lastReadTimestamp = room?.lastRead?.[currentUser.uid];
        if (lastMessage.senderId !== currentUser.uid && (!lastReadTimestamp || lastMessage.createdAt > lastReadTimestamp)) {
             updateDoc(roomRef, { [`lastRead.${currentUser.uid}`]: serverTimestamp() });
        }
    }, [encryptedMessages, currentUser, roomRef, room]);

    useEffect(() => {
        if (isLoadingRoom || !room) return;
        if (room.sessionKey_b64) {
            importKey(room.sessionKey_b64).then(setSessionKey);
        }
    }, [room, isLoadingRoom]);
    
    const processPendingMessages = useCallback(async (key: CryptoKey) => {
        if (pendingMessages.length === 0 || !currentUser || !roomRef) return;
        setIsSending(true);
        const messagesToSend = [...pendingMessages];
        setPendingMessages([]);

        for (const msg of messagesToSend) {
            try {
                const { cipherText, iv } = await encryptBuffer(key, new TextEncoder().encode(msg.text || ''));
                const messagesColRef = collection(firestore, 'chatRooms', roomId, 'messages');
                
                const docRef = await addDoc(messagesColRef, {
                    roomId,
                    senderId: currentUser.uid,
                    cipherText,
                    iv,
                    createdAt: serverTimestamp(),
                    reactions: [],
                    fileUrl: msg.fileUrl || null,
                    fileName: msg.fileName || null,
                    fileType: msg.fileType || null,
                });
                
                const lastMessageText = msg.fileName ? `Sent a file: ${msg.fileName}` : 'Encrypted message';
                await updateDoc(roomRef, { lastMessage: { text: lastMessageText, timestamp: serverTimestamp(), senderId: currentUser.uid } });
            } catch (error) { console.error("Failed to send a pending message:", error); }
        }
        setIsSending(false);
    }, [pendingMessages, currentUser, firestore, roomId, roomRef]);

    useEffect(() => {
        if (sessionKey && pendingMessages.length > 0) {
            processPendingMessages(sessionKey);
        }
    }, [sessionKey, pendingMessages, processPendingMessages]);

    useEffect(() => {
        if (!sessionKey || !encryptedMessages) { setDecryptedMessages([]); return; };

        const decryptAll = async () => {
            const lastReadByOtherUser = room?.lastRead?.[otherUserId!];
            const newDecryptedMessages: DecryptedMessage[] = await Promise.all(
                encryptedMessages.map(async (msg) => {
                    try {
                        const decryptedText = await decryptMessage(sessionKey, msg.cipherText, msg.iv);
                        const isRead = msg.senderId === currentUser?.uid && lastReadByOtherUser && msg.createdAt <= lastReadByOtherUser;
                        return { ...msg, text: decryptedText, status: 'sent', isRead: !!isRead };
                    } catch (e) { return { ...msg, text: "Failed to decrypt message.", status: 'sent' }; }
                })
            );
            setDecryptedMessages(newDecryptedMessages);
        };
        decryptAll();
    }, [sessionKey, encryptedMessages, room, otherUserId, currentUser?.uid]);
    
    const allMessages = useMemo(() => [...decryptedMessages, ...pendingMessages], [decryptedMessages, pendingMessages]);
    
    useEffect(() => {
        if (viewportRef.current) {
            setTimeout(() => {
                viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [allMessages]);

    const handleSendMessage = async ({ file }: { file?: { url: string; name: string; type: string, iv: string } } = {}) => {
        if (!currentUser || (!messageText.trim() && !file) || !roomRef) return;

        const textToSend = messageText.trim();
        setMessageText("");
        setIsCurrentlyTyping(false);
        updateDoc(roomRef, { [`typing.${currentUser.uid}`]: false });

        const pendingMsg: DecryptedMessage = {
            id: `pending-${Date.now()}`,
            senderId: currentUser.uid,
            text: textToSend,
            iv: file?.iv,
            createdAt: new Date(),
            status: 'pending',
            fileUrl: file?.url || undefined,
            fileName: file?.name || undefined,
            fileType: file?.type || undefined,
        };
        setPendingMessages(prev => [...prev, pendingMsg]);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sessionKey) return;
    
        setUploadProgress(0);
        try {
            const fileBuffer = await file.arrayBuffer();
            const { cipherText, iv } = await encryptBuffer(sessionKey, fileBuffer);
            const encryptedBlob = new Blob([atob(cipherText)], { type: 'application/octet-stream' });
            const encryptedFile = new File([encryptedBlob], file.name, { type: 'application/octet-stream' });
            
            setUploadProgress(50);
            
            const result = await upload(encryptedFile, { fileName: file.name, folder: `chats/${roomId}` });
            
            setUploadProgress(100);

            await handleSendMessage({ file: { url: result.url, name: file.name, type: file.type, iv: iv } });
        } catch (error) {
            console.error("File upload failed", error);
        } finally {
            setUploadProgress(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
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
    
    const isLoading = isLoadingRoom || isLoadingOtherUser;
    if (isLoading) return <ChatRoomSkeleton />;
    if (!room || !otherUser) {
        return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center"> <p className="text-lg text-muted-foreground">Chat not found.</p> <Button onClick={() => router.push('/messages')}>Go back to messages</Button> </div> );
    }
    
    return (
        <div className="flex flex-col h-full md:p-4">
          <div className="flex flex-col h-full glass-pane md:rounded-2xl">
            <header className="flex items-center h-20 gap-4 px-4 border-b shrink-0 border-white/20">
                <div className="relative">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={otherUser.photoURL ?? undefined} />
                        <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                    </Avatar>
                     <div className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full border-background bg-green-500"></div>
                </div>
                <div className="flex-1">
                    <p className="font-semibold">{otherUser.displayName}</p>
                    <p className="text-xs text-white/70">
                        {isTyping ? <span className="italic text-primary">typing...</span> : "Active now"}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onToggleInfoPanel}>
                    <UserCircle className="w-5 h-5"/>
                </Button>
                <Button variant="ghost" size="icon"> <MoreVertical className="w-5 h-5"/> </Button>
            </header>
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full" viewportRef={viewportRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {allMessages.length > 0 ? allMessages.map(msg => <ChatMessage key={msg.id} message={msg} isCurrentUserSender={msg.senderId === currentUser?.uid} author={otherUser} onReact={handleReaction} sessionKey={sessionKey} />)
                        : ( <div className="flex items-center justify-center gap-2 p-4 my-8 text-sm text-center rounded-md text-white/60 bg-white/10"> <Lock className="w-4 h-4 shrink-0" /> <p>Messages are end-to-end encrypted.</p> </div> )}
                    </div>
                </ScrollArea>
            </div>
            {uploadProgress !== null && (
                <div className="px-4 pb-2">
                    <div className="flex items-center gap-2 p-2 text-sm border rounded-md bg-muted">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        <span>Uploading file...</span>
                    </div>
                </div>
            )}
            <footer className="p-4 border-t shrink-0 border-white/20">
                <form className="relative" onSubmit={e => { e.preventDefault(); handleSendMessage(); }}>
                     <Input placeholder="Type a message..." value={messageText} onChange={e => handleTyping(e.target.value)} disabled={!currentUser || !sessionKey} className="h-12 text-base px-5 pr-12 rounded-full bg-white/10 focus-visible:ring-primary border-none" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <Button type="submit" size="icon" disabled={!messageText.trim() || !currentUser || isSending || !sessionKey} className="rounded-full bg-primary w-9 h-9">
                          {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5"/>}
                        </Button>
                    </div>
                </form>
            </footer>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
        </div>
    );
}
