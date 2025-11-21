
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatList } from "@/components/p2p-chat/chat-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FindFriendsList } from "@/components/p2p-chat/find-friends-list";

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
                                <CardDescription>Your private conversations and friend finder.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="chats" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="chats">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    My Chats
                                </TabsTrigger>
                                <TabsTrigger value="find">
                                    <Users className="w-4 h-4 mr-2" />
                                    Find Friends
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="chats" className="mt-4">
                                <Suspense fallback={<ListSkeleton />}>
                                    <ChatList />
                                </Suspense>
                            </TabsContent>
                            <TabsContent value="find" className="mt-4">
                                <Suspense fallback={<ListSkeleton />}>
                                    <FindFriendsList />
                                </Suspense>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}
