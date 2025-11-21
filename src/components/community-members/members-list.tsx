

'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { FirebaseUser } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { UserProfilePopover } from '../chat/user-profile-popover';
import { Card } from '../ui/card';
import { useMemo, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { MessageSquare, Loader2, UserPlus, UserCheck, UserMinus, Handshake, Check, X } from 'lucide-react';
import { findOrCreateChat } from '@/lib/chat';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { acceptFriendRequest, declineFriendRequest, sendFriendRequest } from '@/lib/friends';

function MemberListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2);
};

const ActionButton = ({
    currentUser,
    otherUser,
}: {
    currentUser: FirebaseUser;
    otherUser: FirebaseUser;
}) => {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const isFriend = currentUser.friends?.includes(otherUser.id);
    const requestSent = currentUser.friendRequestsSent?.includes(otherUser.id);
    const requestReceived = currentUser.friendRequestsReceived?.includes(otherUser.id);

    const handleStartChat = async () => {
        if (!currentUser || !firestore) return;
        setLoading(true);
        try {
            const roomId = await findOrCreateChat(firestore, currentUser.uid, otherUser.id);
            router.push(`/messages/${roomId}`);
        } catch(error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start chat.' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleAddFriend = async () => {
        if (!currentUser || !firestore) return;
        setLoading(true);
        try {
            await sendFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Sent!", description: `Friend request sent to ${otherUser.displayName}.` });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setLoading(false);
        }
    };
    
    const handleAcceptRequest = async () => {
        if (!currentUser || !firestore) return;
        setLoading(true);
        try {
            await acceptFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Friend Added!", description: `You are now friends with ${otherUser.displayName}.` });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setLoading(false);
        }
    }
    
    const handleDeclineRequest = async () => {
        if (!currentUser || !firestore) return;
        setLoading(true);
        try {
            await declineFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Declined", description: `You have declined the friend request from ${otherUser.displayName}.` });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setLoading(false);
        }
    }

    if (isFriend) {
        return (
            <Button className="w-full" variant="outline" size="sm" onClick={handleStartChat} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Chat
            </Button>
        );
    }
    if (requestReceived) {
        return (
            <div className="flex w-full gap-2">
                <Button className="flex-1" variant="outline" size="sm" onClick={handleAcceptRequest} disabled={loading}>
                    <Check className="w-4 h-4 mr-2"/> Accept
                </Button>
                <Button className="flex-1" variant="destructive" size="sm" onClick={handleDeclineRequest} disabled={loading}>
                    <X className="w-4 h-4 mr-2"/> Decline
                </Button>
            </div>
        );
    }
    if (requestSent) {
        return (
            <Button className="w-full" variant="outline" size="sm" disabled>
                <UserCheck className="w-4 h-4 mr-2" />
                Request Sent
            </Button>
        );
    }
    return (
        <Button className="w-full" size="sm" onClick={handleAddFriend} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Add Friend
        </Button>
    );
};


export function CommunityMembersList() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null, [firestore]);
  const { data: allUsers, isLoading } = useCollection<FirebaseUser>(usersQuery);
  
  const currentUserData = useMemo(() => {
    return allUsers?.find(u => u.id === currentUser?.uid);
  }, [allUsers, currentUser]);

  const { adminUser, coAdminUser, otherUsers, totalMembers } = useMemo(() => {
    if (!allUsers) return { adminUser: null, coAdminUser: null, otherUsers: [], totalMembers: 0 };
    
    const harshAdmin = allUsers.find(u => u.email === 'harshroop100@gmail.com');
    const atrikCoAdmin = allUsers.find(u => u.email === '15mondalatrik@gmail.com');
    
    const adminIds = new Set();
    if (harshAdmin) adminIds.add(harshAdmin.id);
    if (atrikCoAdmin) adminIds.add(atrikCoAdmin.id);
    if (currentUser) adminIds.add(currentUser.uid);

    const others = allUsers.filter(u => !adminIds.has(u.id));

    return { 
        adminUser: harshAdmin ? {
            ...harshAdmin,
            photoURL: 'https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/124599.jpg'
        } : null, 
        coAdminUser: atrikCoAdmin,
        otherUsers: others,
        totalMembers: allUsers.length
    };
  }, [allUsers, currentUser]);


  if (isLoading) {
    return <MemberListSkeleton />;
  }
  
  const getYearBadgeClass = (year?: '1st' | '2nd' | '3rd') => cn({
    'border-sky-500/30 bg-sky-500/20 text-sky-400': year === '1st',
    'border-amber-500/30 bg-amber-500/20 text-amber-400': year === '2nd',
    'border-emerald-500/30 bg-emerald-500/20 text-emerald-400': year === '3rd',
  });

  return (
    <div>
        <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold">
                Total Members: <span className="text-primary">{totalMembers}</span>
            </h3>
        </div>

        <Card className="relative w-full max-w-2xl mx-auto mb-12 overflow-hidden border-0 rounded-xl group aspect-[2/1] animate-tilt">
            <Image 
                src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/624974.jpg"
                alt="Site Administrators"
                fill
                objectFit="cover"
                className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white md:p-6">
                <div className="flex items-end justify-between">
                    {adminUser ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className='cursor-pointer' style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                                    <h2 className="text-lg font-bold md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-400 animate-text-shine">Admin</h2>
                                    <p className="text-xl font-black md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400 animate-text-shine [animation-delay:0.5s]">Harsh</p>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className='w-80'>
                                <UserProfilePopover user={adminUser} />
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <div style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                            <h2 className="text-lg font-bold md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-400 animate-text-shine">Admin</h2>
                            <p className="text-xl font-black md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400 animate-text-shine [animation-delay:0.5s]">Harsh</p>
                        </div>
                    )}
                    {coAdminUser ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className='text-right cursor-pointer' style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                                    <h2 className="text-lg font-bold md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300 animate-text-shine [animation-delay:0.2s]">Co-Admin</h2>
                                    <p className="text-xl font-black md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 animate-text-shine [animation-delay:0.7s]">Atrik</p>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className='w-80'>
                                <UserProfilePopover user={coAdminUser} />
                            </PopoverContent>
                        </Popover>
                    ) : (
                         <div className='text-right' style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                            <h2 className="text-lg font-bold md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300 animate-text-shine [animation-delay:0.2s]">Co-Admin</h2>
                            <p className="text-xl font-black md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 animate-text-shine [animation-delay:0.7s]">Atrik</p>
                        </div>
                    )}
                </div>
                <p className="mt-2 text-xs text-center text-white/80 md:text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>The creators and maintainers of this platform.</p>
            </div>
        </Card>
        
        <div className='my-8 text-center'>
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <span className="px-3 text-lg font-medium bg-background text-muted-foreground">Community Rockstars</span>
                </div>
            </div>
        </div>


        {otherUsers && otherUsers.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {otherUsers.map((user, index) => {
                    const isSelected = selectedUserId === user.id;
                    return (
                        <Card 
                            key={user.id}
                            className={cn(
                                "flex flex-col p-4 text-center transition-all duration-300 transform shadow-sm group bg-card hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 opacity-0 animate-fade-in-up",
                                isSelected && "border-primary/50 -translate-y-1.5 shadow-xl shadow-primary/20"
                            )}
                            style={{ animationDelay: `${index * 75}ms` }}
                            onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                        >
                           <div className='flex flex-col items-center flex-grow'>
                                <Avatar className="w-24 h-24 mb-4 border-4 border-transparent group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105">
                                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
                                    <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className='flex flex-col items-center gap-2'>
                                <p className="font-semibold truncate">{user.displayName}</p>
                                {user.year && <Badge variant="outline" className={getYearBadgeClass(user.year)}>{user.year} Year</Badge>}
                                </div>
                                <p className="w-full mt-1 text-xs truncate text-muted-foreground">{user.email}</p>
                            </div>
                             {currentUserData && isSelected && (
                                <div className="mt-4 w-full animate-fade-in-up animation-delay-200">
                                    <ActionButton currentUser={currentUserData} otherUser={user} />
                                </div>
                             )}
                        </Card>
                    )
                })}
            </div>
        ) : (
            <p className="py-12 text-center text-muted-foreground">
                No other community members found.
            </p>
        )}
    </div>
  );
}
