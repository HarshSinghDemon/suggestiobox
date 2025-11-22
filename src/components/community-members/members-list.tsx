

'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { FirebaseUser } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { UserProfilePopover } from '../chat/user-profile-popover';
import { Card, CardContent } from '../ui/card';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { findOrCreateChat } from '@/lib/chat';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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

function AdminCard({ adminUser, title }: { adminUser: FirebaseUser | null, title: string }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleStartChat = async () => {
        if (!currentUser || !adminUser) return;
        setIsLoading(true);
        try {
            const roomId = await findOrCreateChat(firestore, currentUser.uid, adminUser.id);
            router.push(`/messages/${roomId}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start chat.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!adminUser) {
        return (
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-card">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="w-32 h-6 mt-4" />
                <Skeleton className="w-24 h-4 mt-2" />
            </Card>
        );
    }

    const isSelf = currentUser?.uid === adminUser.id;

    return (
        <Card className="flex flex-col items-center p-6 text-center transition-all duration-300 transform shadow-lg group bg-gradient-to-br from-card to-primary/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
            <div className='relative'>
                <Avatar className="w-24 h-24 mb-4 border-4 border-transparent group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105">
                    <AvatarImage src={adminUser.photoURL ?? undefined} alt={adminUser.displayName ?? ''} />
                    <AvatarFallback className="text-3xl">{getInitials(adminUser.displayName)}</AvatarFallback>
                </Avatar>
                <Badge className="absolute top-0 right-0 px-2 py-1 text-xs font-semibold tracking-wider text-yellow-800 bg-yellow-300 border-2 border-background animate-pulse-slow">
                    {title}
                </Badge>
            </div>
            <p className="text-lg font-semibold">{adminUser.displayName}</p>
            <p className="text-sm text-muted-foreground">{adminUser.email}</p>
            {!isSelf && (
                <Button className="mt-4" size="sm" onClick={handleStartChat} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    Message
                </Button>
            )}
        </Card>
    )
}


export function CommunityMembersList() {
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null, [firestore]);
  const { data: allUsers, isLoading } = useCollection<FirebaseUser>(usersQuery);

  const { adminUser, coAdminUser, otherUsers, totalMembers } = useMemo(() => {
    if (!allUsers) return { adminUser: null, coAdminUser: null, otherUsers: [], totalMembers: 0 };
    
    const harshAdmin = allUsers.find(u => u.email === 'harshroop100@gmail.com');
    const atrikCoAdmin = allUsers.find(u => u.email === '15mondalatrik@gmail.com');
    
    const adminIds = new Set<string>();
    if (harshAdmin) adminIds.add(harshAdmin.id);
    if (atrikCoAdmin) adminIds.add(atrikCoAdmin.id);

    const others = allUsers.filter(u => !adminIds.has(u.id));

    return { 
        adminUser: harshAdmin ? {
            ...harshAdmin,
            photoURL: 'https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/124599.jpg'
        } : null, 
        coAdminUser: atrikCoAdmin || null,
        otherUsers: others,
        totalMembers: allUsers.length
    };
  }, [allUsers]);


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
        
        <div className='my-8 text-center'>
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <span className="px-3 text-lg font-medium uppercase bg-background text-muted-foreground tracking-widest">Admins</span>
                </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">The creators and maintainers of this platform. Contact for any issues.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-12 sm:grid-cols-2 max-w-2xl mx-auto">
            <AdminCard adminUser={adminUser} title="Admin" />
            <AdminCard adminUser={coAdminUser} title="Co-Admin" />
        </div>
        
        <div className='my-8 text-center'>
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <span className="px-3 text-lg font-medium uppercase bg-background text-muted-foreground tracking-widest">Community Rockstars</span>
                </div>
            </div>
        </div>


        {otherUsers && otherUsers.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {otherUsers.map((user, index) => (
                    <Popover key={user.id}>
                        <PopoverTrigger asChild>
                            <Card 
                                className={cn(
                                    "flex flex-col p-4 text-center transition-all duration-300 transform shadow-sm group bg-card hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 opacity-0 animate-fade-in-up cursor-pointer",
                                )}
                                style={{ animationDelay: `${index * 75}ms` }}
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
                            </Card>
                        </PopoverTrigger>
                        <PopoverContent className='w-80'>
                            <UserProfilePopover user={user} />
                        </PopoverContent>
                    </Popover>
                ))}
            </div>
        ) : (
            <p className="py-12 text-center text-muted-foreground">
                No other community members found.
            </p>
        )}
    </div>
  );
}
