

import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { MessageSquare, Users, Lock } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function WelcomePanel() {
    return (
        <div className="relative flex flex-col items-center justify-center h-full gap-6 text-center animate-fade-in-scale overflow-hidden">
            
            {/* Animated GIFs */}
            <Image 
                src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/3d%20paper%20plane.gif"
                alt="Floating paper plane"
                width={120}
                height={120}
                unoptimized
                className="absolute top-10 right-10 w-20 h-20 sm:w-28 sm:h-28 animate-float [filter:drop-shadow(0_10px_15px_rgba(0,0,0,0.3))]"
            />
            
            {/* Main Content */}
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
            <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                    <Suspense fallback={<ListSkeleton />}>
                        <ChatList />
                    </Suspense>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70}>
                    <WelcomePanel />
                </ResizablePanel>
            </ResizablePanelGroup>
        </AuthWrapper>
    );
}
