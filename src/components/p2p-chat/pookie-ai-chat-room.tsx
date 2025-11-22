
'use client';

import { useUser } from "@/firebase";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Bot, Sparkles, User, Users, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { pookieAi } from "@/ai/flows/pookie-ai-flow";
import { Input } from "../ui/input";
import Markdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Card } from "../ui/card";
import Image from "next/image";

type ChatMessage = {
    sender: 'user' | 'pookie';
    text: string;
    id: string;
}

type PookieGender = 'male' | 'female' | 'neutral';

function ChatBubble({ message, pookieAvatarUrl }: { message: ChatMessage; pookieAvatarUrl: string; }) {
    const isPookie = message.sender === 'pookie';

    return (
         <div className={cn("flex items-end gap-2 max-w-lg w-fit", !isPookie && "self-end flex-row-reverse")}>
             {isPookie && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src={pookieAvatarUrl} />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
             )}
            <div className={cn(
                "p-3 rounded-2xl",
                isPookie ? "bg-muted rounded-bl-none" : "bg-primary text-primary-foreground rounded-br-none"
            )}>
                 <div className="prose prose-sm dark:prose-invert max-w-none text-current">
                     <Markdown>{message.text}</Markdown>
                </div>
            </div>
        </div>
    )
}

function PersonaSelectionModal({ isOpen, onOpenChange, onSelect }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSelect: (gender: PookieGender, name: string) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Choose Your AI's Persona</DialogTitle>
                    <DialogDescription>
                        Select a name and gender for your AI friend. This will reset your current chat.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
                    <Card className="flex flex-col items-center justify-center p-4 text-center transition-all duration-300 transform cursor-pointer hover:bg-accent hover:shadow-lg hover:-translate-y-1" onClick={() => onSelect('male', 'Alex')}>
                         <Image src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Boy%20Thinking.gif" alt="Alex" width={64} height={64} className="w-16 h-16 mb-2 rounded-full" unoptimized />
                        <p className="font-semibold">Alex (Male)</p>
                    </Card>
                     <Card className="flex flex-col items-center justify-center p-4 text-center transition-all duration-300 transform cursor-pointer hover:bg-accent hover:shadow-lg hover:-translate-y-1" onClick={() => onSelect('female', 'Mia')}>
                         <Image src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Girl's%20face.gif" alt="Mia" width={64} height={64} className="w-16 h-16 mb-2 rounded-full" unoptimized />
                        <p className="font-semibold">Mia (Female)</p>
                    </Card>
                     <Card className="flex flex-col items-center justify-center p-4 text-center transition-all duration-300 transform cursor-pointer hover:bg-accent hover:shadow-lg hover:-translate-y-1" onClick={() => onSelect('neutral', 'Pookie')}>
                         <Image src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" alt="Pookie" width={64} height={64} className="w-16 h-16 mb-2 rounded-full" />
                        <p className="font-semibold">Pookie (Neutral)</p>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export function PookieAiChatRoom() {
    const { user } = useUser();
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
    const [pookieGender, setPookieGender] = useState<PookieGender | null>(null);
    const [pookieName, setPookieName] = useState<string>('Pookie');
    
    useEffect(() => {
        const storedGender = localStorage.getItem('pookieGender');
        const storedName = localStorage.getItem('pookieName');
        if (storedGender && storedName) {
            setPookieGender(storedGender as PookieGender);
            setPookieName(storedName);
        } else {
            setIsPersonaModalOpen(true);
        }
    }, []);

    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [messages]);
    
    const handlePersonaSelect = (gender: PookieGender, name: string) => {
        localStorage.setItem('pookieGender', gender);
        localStorage.setItem('pookieName', name);
        setPookieGender(gender);
        setPookieName(name);
        setMessages([]); // Reset chat history
        setIsPersonaModalOpen(false);
    }
    
    const pookieAvatarUrl = useMemo(() => {
        if (pookieGender === 'male') return "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Boy%20Thinking.gif";
        if (pookieGender === 'female') return "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Girl's%20face.gif";
        return "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50";
    }, [pookieGender]);


    const handleSendMessage = async () => {
        if (!input.trim() || !user || !pookieGender) return;
        
        const userMessage: ChatMessage = {
            sender: 'user',
            text: input,
            id: `user-${Date.now()}`
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const chatHistory = messages.map((msg, i) => {
                if (msg.sender === 'user' && messages[i+1]?.sender === 'pookie') {
                    return { user: msg.text, model: messages[i+1].text };
                }
                return null;
            }).filter(Boolean) as {user: string, model: string}[];

            const response = await pookieAi({
                message: input,
                userName: user.displayName || "friend",
                aiName: pookieName,
                chatHistory: chatHistory,
                gender: pookieGender
            });
            const pookieMessage: ChatMessage = {
                sender: 'pookie',
                text: response.response,
                id: `pookie-${Date.now()}`
            };
            setMessages(prev => [...prev, pookieMessage]);
        } catch (error) {
            console.error("Pookie AI error:", error);
            const errorMessage: ChatMessage = {
                sender: 'pookie',
                text: "Uh oh, my circuits are a bit scrambled right now. 😵 Try again in a moment!",
                id: `error-${Date.now()}`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }


    return (
         <div className="flex flex-col h-full bg-transparent">
            <PersonaSelectionModal isOpen={isPersonaModalOpen} onOpenChange={setIsPersonaModalOpen} onSelect={handlePersonaSelect} />
            <header className="flex items-center h-16 gap-3 px-4 border-b shrink-0">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/messages')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <button className="flex items-center flex-1 gap-3 text-left rounded-md hover:bg-accent p-1 -m-1" onClick={() => setIsPersonaModalOpen(true)}>
                    <Avatar className="w-10 h-10 border-2 border-primary">
                        <AvatarImage src={pookieAvatarUrl} />
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{pookieName} (AI)</p>
                        <p className="text-xs text-muted-foreground">
                            {isLoading ? <span className="italic text-primary">{pookieName} is typing...</span> : "Online"}
                        </p>
                    </div>
                </button>
                <Button variant="ghost" size="icon" onClick={() => setIsPersonaModalOpen(true)}>
                    <Settings className="w-5 h-5" />
                </Button>
            </header>
            <ScrollArea className="flex-1 min-h-0" viewportRef={viewportRef}>
                 <div className="flex flex-col gap-4 p-6">
                    {messages.length > 0 ? (
                        messages.map(msg => <ChatBubble key={msg.id} message={msg} pookieAvatarUrl={pookieAvatarUrl} />)
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-muted-foreground">
                            <Sparkles className="w-16 h-16 text-primary/50" />
                            <h3 className="text-xl font-semibold">Say hi to {pookieName}!</h3>
                            <p>This is your personal AI chatbot. Ask it for study tips, jokes, or just chat about your day.</p>
                        </div>
                    )}
                     {isLoading && (
                        <div className="flex items-end self-start gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={pookieAvatarUrl} />
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <div className="p-3 rounded-lg bg-muted">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        </div>
                    )}
                 </div>
            </ScrollArea>
             <footer className="p-2 border-t shrink-0 sm:p-4">
                <form
                    className="flex w-full gap-2"
                    onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
                >
                    <Input 
                        placeholder={`Chat with ${pookieName}...`}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={!user || isLoading || !pookieGender}
                        className="text-base h-11 rounded-full bg-input"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || !user || isLoading || !pookieGender} className="rounded-full w-11 h-11">
                       {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}
