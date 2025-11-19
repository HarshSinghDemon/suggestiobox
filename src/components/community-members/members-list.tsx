
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
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

type User = {
    id: string;
    displayName: string;
    photoURL: string;
    email: string;
    year?: '1st' | '2nd' | '3rd';
};

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

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const totalMembers = users?.length ?? 0;

  if (isLoading) {
    return <MemberListSkeleton />;
  }

  return (
    <div>
        <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold">
                Total Members: <span className="text-primary">{totalMembers}</span>
            </h3>
        </div>
        {users && users.length > 0 ? (
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {users.map((user) => (
                    <div key={user.id} className="flex flex-col items-center p-4 text-center border rounded-lg shadow-sm">
                        <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className='flex items-center gap-2'>
                          <p className="font-semibold truncate">{user.displayName}</p>
                          {user.year && <Badge variant="outline">{user.year} Year</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                ))}
            </div>
        ) : (
            <p className="py-12 text-center text-muted-foreground">
                No community members found.
            </p>
        )}
    </div>
  );
}
