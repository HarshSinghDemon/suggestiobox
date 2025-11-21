
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { FirebaseUser } from '@/lib/types';


type UserTagPopoverProps = {
  onSelect: (user: FirebaseUser) => void;
  searchQuery: string;
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('').substring(0, 2);
};

function UserListSkeleton() {
    return (
        <div className="p-2 space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))}
        </div>
    )
}

export function UserTagPopover({ onSelect, searchQuery }: UserTagPopoverProps) {
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection<FirebaseUser>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users.slice(0, 10); // Show some users by default
    return users.filter(user => 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);


  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <p className="text-sm font-medium text-muted-foreground">Tag a user</p>
      </div>
      <ScrollArea className="flex-1 max-h-60">
        <div className="p-1">
          {isLoading ? (
            <UserListSkeleton />
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent"
                onClick={() => onSelect(user)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.photoURL ?? ''} />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.displayName}</span>
                <span className="text-sm text-muted-foreground">({user.email})</span>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-center text-muted-foreground">No users found.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
