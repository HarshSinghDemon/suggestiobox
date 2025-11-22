
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { MessageSquare, Users, Lock } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

function ListSkeleton() {
    return (
        <div className="space-y-2 p-2">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function WelcomePanel() {
    return (
        <div className="relative flex-col items-center justify-center h-full gap-6 text-center animate-fade-in-scale overflow-hidden hidden md:flex">
            
            <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="relative w-56 h-56">
                    <Image 
                        src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Contact%20us.gif"
                        alt="Select a chat"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Select a Chat</h2>
                    <p className="max-w-xs mx-auto text-muted-foreground">
                        Select a conversation from the list to start chatting. Your messages are end-to-end encrypted.
                    </p>
                </div>
                 <div className="flex items-center gap-8 pt-4 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="w-6 h-6"/>
                        <span className="text-xs">Private Chat</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Users className="w-6 h-6"/>
                        <span className="text-xs">Connect</span>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                        <Lock className="w-6 h-6 text-emerald-400"/>
                        <span className="text-xs text-emerald-400">E2E Encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <AuthWrapper>
            <div className="flex flex-col h-full bg-transparent md:grid md:grid-cols-3">
                <div className="flex flex-col h-full col-span-1 border-r border-border">
                    <Suspense fallback={<ListSkeleton />}>
                        <ChatList />
                    </Suspense>
                </div>
                <div className="hidden col-span-2 md:block">
                    <WelcomePanel />
                </div>
            </div>
        </AuthWrapper>
    );
}
