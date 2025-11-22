
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
            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="relative w-56 h-56 animate-pulse-slow">
                    <Image 
                        src="https://ik.imagekit.io/bt0k47tzc/undraw_chatting_re_j55r.svg?updatedAt=1764125345759"
                        alt="Select a chat"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Welcome to Your Private Space</h2>
                    <p className="max-w-xs mx-auto text-muted-foreground">
                        Select a conversation or start a new one to begin chatting with your friends.
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

            {/* Animated GIFs */}
            <div className="absolute top-10 left-10 w-24 h-24 opacity-80 animate-spin-slow">
                 <Image 
                    src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Bird%20pair%20love%20and%20flying%20sky%20(1).gif"
                    alt="Birds flying"
                    fill
                    className="object-contain"
                    unoptimized
                 />
            </div>
            <div className="absolute bottom-10 right-10 w-32 h-32 opacity-80 animate-pulse-slow [animation-delay:0.5s]">
                 <Image 
                    src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/Cute%20Doggie.gif"
                    alt="Cute dog"
                    fill
                    className="object-contain"
                    unoptimized
                 />
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
