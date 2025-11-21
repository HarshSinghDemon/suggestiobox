
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, addDoc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, Message } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Lock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { deriveSharedKey, encryptMessage, decryptMessage, getMyPrivateKey } from "@/lib/e2ee";
import { Alert } from "../ui/alert";

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};


function ChatMessage({ message, sharedKey }: { message: Message; sharedKey: CryptoKey | null }) {
    const [decryptedText, setDecryptedText] = useState('...');
    
    useEffect(() => {
        const decrypt = async () => {
            if (sharedKey && message.cipherText && message.iv) {
                try {
                    const text = await decryptMessage(sharedKey, message.cipherText, message.iv);
                    setDecryptedText(text);
                } catch (e) {
                    console.error("Decryption failed:", e);
                    setDecryptedText("⚠️ Failed to decrypt");
                }
            } else if (!message.cipherText) {
                 setDecryptedText("Message format is outdated.");
            }
        };
        decrypt();
    }, [message, sharedKey]);
    
    return (
        <div className={cn("flex items-end gap-2 max-w-md", message.senderId === 'currentUser' ? "self-end" : "self-start")}>
            {message.senderId !== 'currentUser' && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src={message.userImage ?? undefined} />
                    <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "p-3 rounded-lg",
                message.senderId === 'currentUser' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p>{decryptedText}</p>
                 <p className={cn(
                     "text-xs mt-1",
                     message.senderId === 'currentUser' ? "text-primary-foreground/70" : "text-muted-foreground"
                 )}>
                    {message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'sending...'}
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
    const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);

    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, 'users', currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isLoadingCurrentUser } = useDoc<FirebaseUser>(currentUserRef);
    
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
    
    // Derive shared E2EE key
    useEffect(() => {
        const deriveKey = async () => {
            if (otherUser?.publicKey && currentUserData?.publicKey) {
                try {
                    const privateKey = await getMyPrivateKey();
                    if (!privateKey) {
                        toast({ variant: 'destructive', title: 'Encryption Error', description: 'Could not load your private key.' });
                        return;
                    }
                    const key = await deriveSharedKey(privateKey, otherUser.publicKey);
                    setSharedKey(key);
                } catch(e) {
                    console.error("Key derivation failed", e);
                    toast({ variant: 'destructive', title: 'Encryption Error', description: 'Failed to establish secure connection.' });
                }
            }
        };
        deriveKey();
    }, [otherUser, currentUserData, toast]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!currentUser || !firestore || !otherUser || !messageText.trim() || !sharedKey) {
             toast({ variant: 'destructive', title: "Cannot Send", description: "Secure connection not established or message is empty." });
            return;
        }
        
        setIsSending(true);

        try {
            const { cipherText, iv } = await encryptMessage(sharedKey, messageText.trim());

            const messageData = {
                roomId,
                senderId: currentUser.uid,
                cipherText,
                iv,
                createdAt: serverTimestamp(),
                userName: currentUser.displayName,
                userImage: currentUser.photoURL,
            };

            const messagesColRef = collection(firestore, 'chatRooms', roomId, 'messages');
            await addDoc(messagesColRef, messageData);
            
            await Promise.all([
                updateDoc(roomRef!, {
                    lastMessage: {
                        text: '🔒 Encrypted message',
                        timestamp: serverTimestamp()
                    }
                }),
                // Create notification for the other user
                addDoc(collection(firestore, 'users', otherUser.id, 'notifications'), {
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
                })
            ]);


            setMessageText("");
        } catch(error) {
            console.error("Failed to send message:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not send encrypted message." });
        } finally {
            setIsSending(false);
        }
    };


    const isLoading = isLoadingRoom || isLoadingOtherUser || isLoadingCurrentUser;
    
    if (isLoading) return <ChatRoomSkeleton />;
    
    if (!room || !otherUser) {
        return <p>Chat not found.</p>
    }
    
    const canChat = currentUserData?.publicKey && otherUser?.publicKey;

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
                    {canChat ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-500">
                            <Lock className="w-3 h-3" />
                            <span>End-to-end encrypted</span>
                        </div>
                    ) : (
                         <div className="flex items-center gap-1.5 text-xs text-amber-500">
                            <AlertCircle className="w-3 h-3" />
                            <span>Not secure</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4 p-6">
                        {isLoadingMessages ? (
                            <Loader2 className="m-auto animate-spin" />
                        ) : !canChat ? (
                            <Alert variant="destructive">
                                <AlertCircle className="w-4 h-4" />
                                <CardTitle>Insecure Chat</CardTitle>
                                <CardDescription>
                                    End-to-end encryption cannot be established because one or both users have an outdated account without an encryption key. Please ask the user to log in again to generate their key.
                                </CardDescription>
                            </Alert>
                        ) : messages && messages.length > 0 ? (
                            messages.map(msg => (
                                <ChatMessage key={msg.id} message={{...msg, senderId: msg.senderId === currentUser?.uid ? 'currentUser' : 'otherUser' }} sharedKey={sharedKey} />
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
                        placeholder={sharedKey ? "Type your encrypted message..." : "Establishing secure connection..."}
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        disabled={isSending || !sharedKey}
                    />
                    <Button type="submit" size="icon" disabled={isSending || !messageText.trim() || !sharedKey}>
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
