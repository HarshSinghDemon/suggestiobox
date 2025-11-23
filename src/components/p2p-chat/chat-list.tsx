

'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import type { ChatRoom, FirebaseUser, GroupChatRoom } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare, Search, UserPlus, Bot, Edit, MoreHorizontal, LogOut, Plus, Shield, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendsList } from "./friends-list";
import { FindFriendsList } from "./find-friends-list";
import { useRouter } from "next/navigation";
import { ScrollArea } from "../ui/scroll-area";

function ChatListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

export function ChatList({ selectedRoomId }: { selectedRoomId?: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    const { data: userData, isLoading: isLoadingUser } = useDoc<FirebaseUser>(userDocRef);

    const chatRoomIds = userData?.chatRoomIds || [];
    const groupChatRoomIds = userData?.groupChatRoomIds || [];

    const chatRoomsQuery = useMemoFirebase(() => {
        if (!firestore || chatRoomIds.length === 0) return null;
        return query(
            collection(firestore, 'chatRooms'),
            where('__name__', 'in', chatRoomIds),
        );
    }, [firestore, chatRoomIds]);

    const groupChatRoomsQuery = useMemoFirebase(() => {
        if (!firestore || groupChatRoomIds.length === 0) return null;
        return query(
            collection(firestore, 'groupChatRooms'),
            where('__name__', 'in', groupChatRoomIds),
        );
    }, [firestore, groupChatRoomIds]);


    const { data: chatRooms, isLoading: isLoadingRooms } = useCollection<ChatRoom>(chatRoomsQuery);
    const { data: groupChatRooms, isLoading: isLoadingGroupRooms } = useCollection<GroupChatRoom>(groupChatRoomsQuery);

    const allParticipantIds = useMemo(() => {
        if (!chatRooms) return [];
        const ids = new Set<string>();
        chatRooms.forEach(room => room.participants.forEach(id => ids.add(id)));
        return Array.from(ids);
    }, [chatRooms]);
    
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || allParticipantIds.length === 0) return null;
        return query(collection(firestore, 'users'), where('id', 'in', allParticipantIds));
    }, [firestore, allParticipantIds]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<FirebaseUser>(usersQuery);

    const usersMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);
    
    const enrichedChatRooms = useMemo(() => {
        if (!chatRooms || !currentUser || usersMap.size === 0) return [];
        return chatRooms.map(room => {
            const otherParticipantId = room.participants.find(p => p !== currentUser.uid);
            const participantDetails = otherParticipantId ? usersMap.get(otherParticipantId) : null;
            
            const isUnread = room.lastMessage && room.lastMessage.senderId !== currentUser.uid && (!room.lastRead?.[currentUser.uid] || room.lastRead[currentUser.uid] < room.lastMessage.timestamp);

            return {
                ...room,
                participantDetails: participantDetails ? [{
                    id: participantDetails.id,
                    displayName: participantDetails.displayName,
                    photoURL: participantDetails.photoURL
                }] : [],
                isUnread,
            };
        }).filter(room => room.participantDetails.length > 0);
    }, [chatRooms, currentUser, usersMap]);
    
    const sortedChats = useMemo(() => {
        const allChats = [
            ...(enrichedChatRooms || []),
            ...(groupChatRooms || [])
        ];

        return allChats.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.toMillis() || a.createdAt?.toMillis() || 0;
            const timeB = b.lastMessage?.timestamp?.toMillis() || b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });

    }, [enrichedChatRooms, groupChatRooms]);

    const filteredChatRooms = useMemo(() => {
        const pookieName = "Pookie (AI)";
        const pookieVisible = pookieName.toLowerCase().includes(searchQuery.toLowerCase());

        const userChats = sortedChats.filter(room => {
            if ('name' in room) { // It's a group chat
                return room.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            // It's a private chat
            return room.participantDetails[0]?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
        });

        return { userChats, pookieVisible };

    }, [sortedChats, searchQuery]);
    
    const isLoading = isLoadingUser || isLoadingRooms || isLoadingGroupRooms || (allParticipantIds.length > 0 && isLoadingUsers);

    return (
      <div className="h-full w-full flex flex-col p-4 md:p-6 glass-pane md:rounded-r-2xl">
        <header className="flex items-center justify-between pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={currentUser?.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(currentUser?.displayName)}</AvatarFallback>
                </Avatar>
                <div className="font-semibold text-lg">
                    <p>Good Morning!</p>
                </div>
            </div>
             <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <LogOut className="w-5 h-5"/>
            </Button>
        </header>

        <div className="py-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                    placeholder="Search..."
                    className="pl-9 h-10 rounded-full bg-white/10 border-none focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <Dialog>
            <DialogTrigger asChild>
                 <div className="flex items-center justify-center gap-2 p-1.5 mb-2 text-xs rounded-full bg-white/10 text-emerald-300 animate-pulse-slow cursor-pointer hover:bg-white/20 transition-colors">
                    <Shield className="w-3.5 h-3.5" />
                    <span>End-to-End Encrypted</span>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-pane">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-emerald-400" />
                        Our Commitment to Your Privacy
                    </DialogTitle>
                     <DialogDescription>
                        Your conversations are private, period.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-white/80">
                    <p>
                        All messages in this chat are secured with <strong className="text-emerald-300">end-to-end encryption (E2EE)</strong> using the AES-GCM standard.
                    </p>
                    <p>
                        This means only you and the person you're talking to can read what's sent. No one in between, not even us, can decipher your messages.
                    </p>
                    <p className="p-3 text-center border rounded-lg bg-white/5 border-white/10">
                        <span className="font-semibold text-white">"Don't worry, even the developer can't see your messages. Not even the database knows what you're up to! It's your little secret."</span> 😉
                    </p>
                </div>
            </DialogContent>
        </Dialog>


        <div className="relative flex items-center gap-1 p-1 my-2 rounded-full bg-white/10 backdrop-blur-sm">
            <div className={cn(
                "absolute left-1 top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white/20 rounded-full transition-transform duration-300 ease-in-out",
                "transform",
                 activeTab === 'groups' ? "translateX(100%)" : "translateX(0)"
            )}></div>
            <Button 
              variant={'ghost'} 
              className={cn("z-10 rounded-full flex-1 transition-all duration-300", activeTab === 'chats' ? 'text-white' : 'text-white/60')}
              onClick={() => setActiveTab('chats')}
            >
              Chats
            </Button>
            <Button 
                variant="ghost" 
                className={cn("z-10 rounded-full flex-1 transition-all duration-300", activeTab === 'groups' ? 'text-white' : 'text-white/60')}
                onClick={() => setActiveTab('groups')}
            >
                Groups
            </Button>
        </div>


        <div className="flex-1 min-h-0 -mr-4">
          <ScrollArea className="h-full pr-4">
              {isLoading ? (
                  <ChatListSkeleton />
              ) : (
                  <div className="space-y-1">
                      {activeTab === 'chats' && filteredChatRooms.pookieVisible && (
                           <Link href="/messages/pookie-ai" className="block">
                              <div className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-2xl transition-colors hover:bg-white/20",
                                  selectedRoomId === 'pookie-ai' && "bg-white/20"
                              )}>
                                  <Avatar className="w-12 h-12">
                                      <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pookie&backgroundColor=7950f2,f1efff&backgroundType=gradientLinear&radius=50" />
                                      <AvatarFallback><Bot /></AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 overflow-hidden">
                                      <div className="flex items-baseline justify-between">
                                          <p className="font-semibold truncate">Pookie (AI)</p>
                                      </div>
                                      <p className="text-sm truncate text-white/70">Your personal AI friend</p>
                                  </div>
                              </div>
                          </Link>
                      )}
                      
                      {activeTab === 'chats' && filteredChatRooms.userChats.filter(chat => !('name' in chat)).length === 0 && !filteredChatRooms.pookieVisible && (
                        <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-white/50">
                            <MessagesSquare className="w-12 h-12 mx-auto" />
                            <p className="font-semibold">No private chats yet.</p>
                            <p className="text-xs">Use the 'Add Friend' button below to start a conversation.</p>
                        </div>
                      )}
                      
                      {activeTab === 'groups' && filteredChatRooms.userChats.filter(chat => 'name' in chat).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center text-white/50">
                            <Users className="w-12 h-12 mx-auto" />
                            <p className="font-semibold">No groups found.</p>
                            <p className="text-xs">Use the 'New Group' button below to create one.</p>
                        </div>
                      )}

                      {filteredChatRooms.userChats.map(room => {
                          const isGroup = 'name' in room;
                          
                          if ((activeTab === 'chats' && isGroup) || (activeTab === 'groups' && !isGroup)) {
                              return null;
                          }

                          const link = isGroup ? `/messages/group/${room.id}` : `/messages/${room.id}`;
                          const name = isGroup ? room.name : room.participantDetails?.[0]?.displayName;
                          const photoURL = isGroup ? room.photoURL : room.participantDetails?.[0]?.photoURL;

                          return (
                              <Link href={link} key={room.id} className="block">
                                  <div className={cn(
                                      "flex items-center gap-3 p-2.5 rounded-2xl transition-colors hover:bg-white/20",
                                      selectedRoomId === room.id && "bg-white/20"
                                  )}>
                                      <div className="relative">
                                          <Avatar className="w-12 h-12">
                                              <AvatarImage src={photoURL ?? undefined} />
                                              <AvatarFallback>
                                                  {isGroup ? <Users /> : getInitials(name)}
                                              </AvatarFallback>
                                          </Avatar>
                                          {!isGroup && <div className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full border-background bg-green-500"></div>}
                                      </div>
                                      <div className="flex-1 overflow-hidden">
                                          <div className="flex items-baseline justify-between">
                                              <p className="font-semibold truncate">{name}</p>
                                              {room.lastMessage?.timestamp && (
                                                  <p className="text-xs text-white/50 self-start shrink-0">
                                                      {formatDistanceToNow(room.lastMessage.timestamp.toDate(), { addSuffix: true, includeSeconds: true }).replace('about ','').replace('less than a minute ago', 'now')}
                                                  </p>
                                              )}
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <p className={cn("text-sm truncate", room.isUnread ? "text-white font-medium" : "text-white/60")}>
                                                  {room.lastMessage ? (
                                                      (room.lastMessage.senderId === currentUser?.uid ? "You: " : "") + 
                                                      (room.lastMessage.text || "Encrypted message")
                                                  ) : isGroup ? "No messages yet." : "Chat not started."}
                                              </p>
                                              {room.isUnread && (
                                                  <div className="flex items-center justify-center w-5 h-5 text-xs text-white rounded-full bg-primary shrink-0">
                                                      1
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </Link>
                          )
                      })}
                  </div>
              )}
          </ScrollArea>
        </div>
         <div className="pt-4 mt-auto flex gap-2">
            {activeTab === 'chats' ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" className="flex-1 h-12 rounded-full">
                            <UserPlus className="w-5 h-5 mr-2"/>
                            Add Friend
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 border-0 max-w-md glass-pane">
                        <Tabs defaultValue="friends" className="w-full">
                            <DialogHeader className="p-4 border-b border-white/20">
                                <DialogTitle>Manage Friends</DialogTitle>
                                <TabsList className="grid w-full grid-cols-2 mt-2 bg-white/10">
                                    <TabsTrigger value="friends">My Friends</TabsTrigger>
                                    <TabsTrigger value="find">Find People</TabsTrigger>
                                </TabsList>
                            </DialogHeader>
                            <TabsContent value="friends" className="m-0">
                                <FriendsList />
                            </TabsContent>
                            <TabsContent value="find" className="m-0">
                                <FindFriendsList />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            ) : (
                <Button variant="secondary" className="h-12 rounded-full flex-1" onClick={() => router.push('/messages/new-group')}>
                    <Users className="w-5 h-5 mr-2"/>
                    New Group
                </Button>
            )}
        </div>
      </div>
    )
}
