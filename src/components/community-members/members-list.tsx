
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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

  const totalMembers = users?.length ?? 0;
  
  const adminUser: FirebaseUser = {
      id: 'admin-harsh',
      uid: 'admin-harsh',
      displayName: 'Harsh Singh',
      email: 'harshroop100@gmail.com',
      photoURL: 'https://avatars.githubusercontent.com/u/108394287?v=4',
      year: '3rd',
  };

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

        <div className="mb-12">
            <Popover>
                <PopoverTrigger asChild>
                    <Card className="relative p-6 overflow-hidden text-center transition-all duration-300 transform border-2 cursor-pointer border-purple-500/50 bg-gradient-to-tr from-purple-600/10 via-red-500/10 to-background hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2 animate-tilt">
                         <div className="absolute top-0 right-0 px-4 py-1 text-xs font-bold tracking-widest text-white uppercase rounded-bl-lg bg-gradient-to-tr from-purple-600 to-red-500">Admin</div>
                        <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-purple-400">
                            <AvatarImage src={adminUser.photoURL} alt={adminUser.displayName ?? ''} />
                            <AvatarFallback className="text-4xl">{getInitials(adminUser.displayName)}</AvatarFallback>
                        </Avatar>
                        <h4 className="text-xl font-bold">{adminUser.displayName}</h4>
                        <p className="text-sm text-muted-foreground">{adminUser.email}</p>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                            <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/20 text-emerald-400">3rd Year</Badge>
                            <Badge className="border-transparent animate-super-senior-shine text-purple-200 transition-all hover:shadow-purple-400/30 hover:scale-105">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2L9 9l-7 2.5 7 2.5 3 6.5 3-6.5 7-2.5-7-2.5L12 2z"/><path d="M18 9l-2.25 4.75L12 15l-3.75-1.25L6 9"/><path d="M12 15l3 6.5 3-6.5"/></svg>
                                Super Senior
                            </Badge>
                        </div>
                    </Card>
                </PopoverTrigger>
                 <PopoverContent className='w-80'>
                    <UserProfilePopover user={adminUser} />
                </PopoverContent>
            </Popover>
        </div>
        
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


        {users && users.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {users.map((user, index) => {
                    if (user.email === adminUser.email) return null;
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
                No community members found.
            </p>
        )}
    </div>
  );
}
