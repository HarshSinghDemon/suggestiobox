
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ChatListSkeleton() {
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

export default function MessagesPage() {
    return (
        <AuthWrapper>
            <div className="container max-w-3xl py-8 mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <MessageSquare className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>My Messages</CardTitle>
                                <CardDescription>Your private conversations.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<ChatListSkeleton />}>
                            <ChatList />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}
