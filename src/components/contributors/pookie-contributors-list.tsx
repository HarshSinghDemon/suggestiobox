'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion, Assignment, FirebaseUser } from '@/lib/types';
import { collection } from 'firebase/firestore';
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
import { Award, Medal, Trophy } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { UserProfilePopover } from '../chat/user-profile-popover';

type Contributor = {
  userId: string;
  contributions: number;
  user: FirebaseUser;
};

function ContributorListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
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

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-yellow-700" />;
    return <span className="w-6 text-center text-muted-foreground">{rank}</span>;
}


export function PookieContributorsList() {
  const firestore = useFirestore();

  const suggestionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'suggestions') : null, [firestore]);
  const assignmentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'assignments') : null, [firestore]);
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);

  const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);
  const { data: assignments, isLoading: assignmentsLoading } = useCollection<Assignment>(assignmentsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<FirebaseUser>(usersQuery);

  const topContributors = useMemo(() => {
    if (!suggestions || !assignments || !users) return [];

    const usersMap = new Map<string, FirebaseUser>(users.map(u => [u.id, u]));
    const contributorMap = new Map<string, Contributor>();

    const allContributions = [...suggestions, ...assignments];

    allContributions.forEach(item => {
      if (!item.userId || item.userId === 'anonymous') return;

      const user = usersMap.get(item.userId);
      if (!user) return; // User might have been deleted

      const existing = contributorMap.get(item.userId);
      if (existing) {
        existing.contributions += 1;
      } else {
        contributorMap.set(item.userId, {
          userId: item.userId,
          user: user,
          contributions: 1,
        });
      }
    });

    return Array.from(contributorMap.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 20); // Get top 20 contributors

  }, [suggestions, assignments, users]);

  const isLoading = suggestionsLoading || assignmentsLoading || usersLoading;

  if (isLoading) {
    return <ContributorListSkeleton />;
  }

  return (
    <div>
        {topContributors.length > 0 ? (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='w-[50px] text-center'>Rank</TableHead>
                        <TableHead>Contributor</TableHead>
                        <TableHead className="text-right">Contributions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topContributors.map((pookie, index) => (
                        <TableRow key={pookie.userId}>
                            <TableCell className="text-lg font-bold text-center">
                                <RankIcon rank={index + 1} />
                            </TableCell>
                            <TableCell>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div className="flex items-center gap-3 cursor-pointer">
                                            <Avatar>
                                                <AvatarImage src={pookie.user.photoURL ?? undefined} alt={pookie.user.displayName ?? ''} />
                                                <AvatarFallback>{getInitials(pookie.user.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{pookie.user.displayName}</p>
                                            </div>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-80'>
                                        <UserProfilePopover user={pookie.user} />
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                            <TableCell className="text-right text-lg font-semibold">{pookie.contributions}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        ) : (
            <p className="py-12 text-center text-muted-foreground">
                No contributions have been made yet. Be the first!
            </p>
        )}
    </div>
  );
}
