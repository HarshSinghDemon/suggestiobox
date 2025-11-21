
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { PrivateChatRoom } from "@/components/p2p-chat/private-chat-room";

type PrivateChatPageProps = {
    params: {
        roomId: string;
    }
}

export default function PrivateChatPage({ params }: PrivateChatPageProps) {
    return (
        <AuthWrapper>
            <div className="container h-[calc(100vh-4rem)] py-6">
                <PrivateChatRoom roomId={params.roomId} />
            </div>
        </AuthWrapper>
    )
}
