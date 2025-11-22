'use client';

import { useUser } from "@/firebase";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Send, Bot, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { pookieAi } from "@/ai/flows/pookie-ai-flow";
import { Input } from "../ui/input";
import Markdown from 'react-markdown';

type ChatMessage = {
    sender: 'user' | 'pookie';
    text: string;
    id: string;
}

function ChatBubble({ message }: { message: ChatMessage }) {
    const isPookie = message.sender === 'pookie';

    return (
         <div className={cn("flex items-end gap-2 max-w-lg w-fit", !isPookie && "self-end flex-row-reverse")}>
             {isPookie && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
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

export function PookieAiChatRoom() {
    const { user } = useUser();
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !user) return;
        
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
                chatHistory: chatHistory
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
         <div className="flex flex-col h-full bg-card">
            <header className="flex items-center h-16 gap-3 px-4 border-b shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/messages')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10 border-2 border-primary">
                    <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold">Pookie (AI)</p>
                    <p className="text-xs text-muted-foreground">
                        {isLoading ? <span className="italic text-primary">Pookie is typing...</span> : "Online"}
                    </p>
                </div>
            </header>
            <ScrollArea className="flex-1" viewportRef={viewportRef}>
                 <div className="flex flex-col gap-4 p-6">
                    {messages.length > 0 ? (
                        messages.map(msg => <ChatBubble key={msg.id} message={msg} />)
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-muted-foreground">
                            <Sparkles className="w-16 h-16 text-primary/50" />
                            <h3 className="text-xl font-semibold">Say hi to Pookie!</h3>
                            <p>This is your personal AI chatbot. Ask it for study tips, jokes, or just chat about your day.</p>
                        </div>
                    )}
                     {isLoading && (
                        <div className="flex items-end self-start gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
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
                        placeholder="Chat with Pookie..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={!user || isLoading}
                        className="text-base"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || !user || isLoading}>
                       {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}
