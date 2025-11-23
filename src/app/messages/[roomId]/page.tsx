
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { PrivateChatRoom } from "@/components/p2p-chat/private-chat-room";
import { Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { UserInfoPanel } from "@/components/p2p-chat/user-info-panel";


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

export default function PrivateChatPage({ params }: { params: { roomId: string } }) {
    const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);

    const toggleInfoPanel = () => {
        setIsInfoPanelVisible(prev => !prev);
    }
    
    return (
        <AuthWrapper>
            <div className="flex flex-col h-full">
                <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
                    <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="hidden lg:block">
                         <Suspense fallback={<ChatListSkeleton />}>
                            <ChatList selectedRoomId={params.roomId} />
                        </Suspense>
                    </ResizablePanel>
                    <ResizableHandle withHandle className="hidden lg:flex"/>
                    <ResizablePanel defaultSize={isInfoPanelVisible ? 50 : 75} minSize={30}>
                        <PrivateChatRoom roomId={params.roomId} onToggleInfoPanel={toggleInfoPanel} />
                    </ResizablePanel>
                    {isInfoPanelVisible && (
                        <>
                            <ResizableHandle withHandle className="hidden lg:flex" />
                            <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="hidden lg:block">
                                <UserInfoPanel roomId={params.roomId} />
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>
        </AuthWrapper>
    )
}
