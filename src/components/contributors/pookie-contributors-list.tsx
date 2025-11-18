'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion, Assignment } from '@/lib/types';
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

type Contributor = {
  userId: string;
  userName: string;
  userImage: string;
  contributions: number;
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

  const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);
  const { data: assignments, isLoading: assignmentsLoading } = useCollection<Assignment>(assignmentsQuery);

  const topContributors = useMemo(() => {
    if (!suggestions || !assignments) return [];

    const contributorMap = new Map<string, Contributor>();

    const allContributions = [...suggestions, ...assignments];

    allContributions.forEach(item => {
      if (!item.userId || item.userId === 'anonymous') return;

      const existing = contributorMap.get(item.userId);
      if (existing) {
        existing.contributions += 1;
      } else {
        contributorMap.set(item.userId, {
          userId: item.userId,
          userName: item.userName || 'Anonymous',
          userImage: item.userImage || '',
          contributions: 1,
        });
      }
    });

    return Array.from(contributorMap.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 20); // Get top 20 contributors

  }, [suggestions, assignments]);

  const isLoading = suggestionsLoading || assignmentsLoading;

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
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={pookie.userImage} alt={pookie.userName} />
                                        <AvatarFallback>{getInitials(pookie.userName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{pookie.userName}</p>
                                        <p className="text-xs text-muted-foreground">User ID: {pookie.userId.substring(0,8)}...</p>
                                    </div>
                                </div>
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
