
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { PrivateChatRoom } from "@/components/p2p-chat/private-chat-room";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveCodeEditor } from "@/components/p2p-chat/live-code-editor";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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
            <div className="h-[calc(100vh-4rem)]">
                 <div className="h-full border rounded-lg md:grid md:grid-cols-[350px_1fr]">
                    <div className="h-full hidden md:col-span-1 md:border-r md:block">
                        <Suspense fallback={<ChatListSkeleton />}>
                            <ChatList selectedRoomId={params.roomId} />
                        </Suspense>
                    </div>
                    <div className="h-full md:col-span-1">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                            <ResizablePanel defaultSize={50}>
                                <PrivateChatRoom roomId={params.roomId} />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50}>
                                <LiveCodeEditor roomId={params.roomId} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
            </div>
        </AuthWrapper>
    )
}
