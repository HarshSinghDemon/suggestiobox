

'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { FirebaseUser } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { UserProfilePopover } from '../chat/user-profile-popover';
import { ShieldCheck, Star } from 'lucide-react';
import { Card } from '../ui/card';
import { useMemo } from 'react';
import Image from 'next/image';

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


export function CommunityMembersList() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null, [firestore]);

  const { data: users, isLoading } = useCollection<FirebaseUser>(usersQuery);

  const { adminUser, coAdminUser, otherUsers } = useMemo(() => {
    if (!users) return { adminUser: null, coAdminUser: null, otherUsers: [] };
    const harshAdmin = users.find(u => u.email === 'harshroop100@gmail.com');
    const atrikCoAdmin = users.find(u => u.email === '15mondalatrik@gmail.com');
    
    const adminIds = new Set();
    if (harshAdmin) adminIds.add(harshAdmin.id);
    if (atrikCoAdmin) adminIds.add(atrikCoAdmin.id);

    const others = users.filter(u => !adminIds.has(u.id));

    return { 
        adminUser: harshAdmin ? {
            ...harshAdmin,
            photoURL: 'https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/124599.jpg'
        } : null, 
        coAdminUser: atrikCoAdmin,
        otherUsers: others
    };
  }, [users]);


  const totalMembers = users?.length ?? 0;

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
                                <div className='cursor-pointer'>
                                    <h2 className="text-2xl font-bold md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-text-shine">Admin</h2>
                                    <p className="text-lg font-bold md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-400 animate-text-shine [animation-delay:0.5s]">Harsh</p>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className='w-80'>
                                <UserProfilePopover user={adminUser} />
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-text-shine">Admin</h2>
                            <p className="text-lg font-bold md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-400 animate-text-shine [animation-delay:0.5s]">Harsh</p>
                        </div>
                    )}
                    {coAdminUser ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className='text-right cursor-pointer'>
                                    <h2 className="text-2xl font-bold md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-400 to-cyan-500 animate-text-shine [animation-delay:0.2s]">Co-Admin</h2>
                                    <p className="text-lg font-bold md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-lime-400 to-emerald-400 animate-text-shine [animation-delay:0.7s]">Atrik</p>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className='w-80'>
                                <UserProfilePopover user={coAdminUser} />
                            </PopoverContent>
                        </Popover>
                    ) : (
                         <div className='text-right'>
                            <h2 className="text-2xl font-bold md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-400 to-cyan-500 animate-text-shine [animation-delay:0.2s]">Co-Admin</h2>
                            <p className="text-lg font-bold md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-lime-400 to-emerald-400 animate-text-shine [animation-delay:0.7s]">Atrik</p>
                        </div>
                    )}
                </div>
                <p className="mt-2 text-sm text-center text-white/80 md:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>The creators and maintainers of this platform.</p>
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
                    return (
                        <Popover key={user.id}>
                            <PopoverTrigger asChild>
                                <div 
                                    className="flex flex-col items-center p-4 text-center transition-all duration-300 transform border rounded-lg shadow-sm group bg-card hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 cursor-pointer opacity-0 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 75}ms` }}
                                >
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
                            </PopoverTrigger>
                            <PopoverContent className='w-80'>
                                <UserProfilePopover user={user} />
                            </PopoverContent>
                        </Popover>
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
