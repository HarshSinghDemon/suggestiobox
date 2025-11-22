
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { PrivateChatRoom } from "@/components/p2p-chat/private-chat-room";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { UserInfoPanel } from "@/components/p2p-chat/user-info-panel";
import { cn } from "@/lib/utils";

type PrivateChatPageProps = {
    params: {
        roomId: string;
    }
}

function ChatListSkeleton() {
    return (
        <div className="p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
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

export default function PrivateChatPage({ params }: PrivateChatPageProps) {
    return (
        <AuthWrapper>
            <div className="flex flex-col h-full">
                <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
                    <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className={cn("hidden lg:block", params.roomId ? "lg:block" : "hidden")}>
                         <Suspense fallback={<ChatListSkeleton />}>
                            <ChatList selectedRoomId={params.roomId} />
                        </Suspense>
                    </ResizablePanel>
                    <ResizableHandle withHandle className="hidden lg:flex"/>
                    <ResizablePanel defaultSize={55} minSize={30}>
                        <PrivateChatRoom roomId={params.roomId} />
                    </ResizablePanel>
                    <ResizableHandle withHandle className="hidden lg:flex"/>
                    <ResizablePanel defaultSize={20} minSize={20} maxSize={30} className="hidden md:block">
                         <Suspense fallback={<p>Loading info...</p>}>
                            <UserInfoPanel roomId={params.roomId} />
                        </Suspense>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </AuthWrapper>
    )
}
