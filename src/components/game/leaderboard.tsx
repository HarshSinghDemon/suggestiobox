'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { GameScore } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trophy } from 'lucide-react';
import { useMemo } from 'react';

type LeaderboardProps = {
  gameId: string;
};

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
};

function LeaderboardSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function Leaderboard({ gameId }: LeaderboardProps) {
  const firestore = useFirestore();

  const scoresQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'games', gameId, 'scores'), orderBy('score', 'desc'), limit(100))
        : null,
    [firestore, gameId]
  );

  const { data: scores, isLoading } = useCollection<GameScore>(scoresQuery);

  const topScores = useMemo(() => {
    if (!scores) return [];
    
    const uniquePlayerScores = new Map<string, GameScore>();

    for (const score of scores) {
      if (!uniquePlayerScores.has(score.userId)) {
        uniquePlayerScores.set(score.userId, score);
      }
    }

    return Array.from(uniquePlayerScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
      
  }, [scores]);

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Top Scores
      </h3>
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : topScores && topScores.length > 0 ? (
        <ul className="space-y-4">
          {topScores.map((score, index) => (
            <li key={score.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm w-6 text-center">{index + 1}</span>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={score.userImage ?? undefined} />
                  <AvatarFallback>{getInitials(score.userName)}</AvatarFallback>
                </Avatar>
                <span className="font-medium truncate text-sm">{score.userName}</span>
              </div>
              <span className="font-bold text-primary">{score.score.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-center text-muted-foreground">No scores yet. Be the first!</p>
      )}
    </div>
  );
}
