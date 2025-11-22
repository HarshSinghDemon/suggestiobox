
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
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="relative w-48 h-48">
                <Image 
                    src="https://ik.imagekit.io/bt0k47tzc/undraw_chatting_re_j55r_1.svg?updatedAt=1764121287955"
                    alt="Select a chat"
                    fill
                    className="object-contain"
                />
            </div>
            <h2 className="text-2xl font-bold">Your Private Messenger</h2>
            <p className="max-w-xs text-muted-foreground">
                Select a conversation from the list to start chatting. Your messages are end-to-end encrypted.
            </p>
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
