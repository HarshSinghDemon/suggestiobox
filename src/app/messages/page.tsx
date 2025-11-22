
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Lock } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
        <div className="flex-col items-center justify-center h-full gap-4 text-center bg-muted/50 rounded-lg hidden md:flex">
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
            <div className="h-[calc(100vh-4rem)]">
                 <div className="h-full border rounded-lg md:grid md:grid-cols-[350px_1fr]">
                    <div className="h-full md:col-span-1 md:border-r">
                        <Suspense fallback={<ListSkeleton />}>
                            <ChatList />
                        </Suspense>
                    </div>
                    <div className="hidden h-full md:col-span-1 md:block">
                        <WelcomePanel />
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}
