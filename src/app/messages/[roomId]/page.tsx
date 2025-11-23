
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { PrivateChatRoom } from "@/components/p2p-chat/private-chat-room";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
            <div className="flex h-full w-full">
                 <aside className="hidden md:block md:w-1/3 lg:w-1/4 h-full">
                    <Suspense fallback={<ChatListSkeleton />}>
                        <ChatList selectedRoomId={params.roomId} />
                    </Suspense>
                </aside>
                <div className="flex-1 h-full">
                    <PrivateChatRoom roomId={params.roomId} />
                </div>
            </div>
        </AuthWrapper>
    )
}
