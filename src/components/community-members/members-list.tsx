
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
        <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold">
                Total Members: <span className="text-primary">{totalMembers}</span>
            </h3>
        </div>
        {users && users.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {users.map((user, index) => (
                    <Popover key={user.id}>
                        <PopoverTrigger asChild>
                            <div 
                                className="flex flex-col items-center p-4 text-center transition-all duration-300 transform border rounded-lg shadow-sm group bg-card hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 cursor-pointer"
                                style={{ animationDelay: `${index * 50}ms`, animation: `fadeInUp 0.5s ease-out forwards` }}
                            >
                                <Avatar className="w-24 h-24 mb-4 border-4 border-transparent group-hover:border-primary/50 transition-colors duration-300">
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
                ))}
            </div>
        ) : (
            <p className="py-12 text-center text-muted-foreground">
                No community members found.
            </p>
        )}
        <style jsx>{`
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .grid > div {
                opacity: 0; /* Start hidden for animation */
            }
        `}</style>
    </div>
  );
}
