
'use client';

import { BrickBreakerGame } from '@/components/game/brick-breaker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Leaderboard } from '@/components/game/leaderboard';
import { useUser } from '@/firebase';

export default function BrickBreakerPage() {
    const { user } = useUser();
  return (
    <AuthWrapper>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row">
        <div className="flex-grow p-0 md:p-4">
            <Card className="flex flex-col h-full border-0 md:border rounded-none md:rounded-lg">
                <CardHeader className="text-center">
                    <CardTitle>Brick Breaker</CardTitle>
                    <CardDescription>Use your mouse or finger to move the paddle. Clear all the bricks!</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <BrickBreakerGame />
                </CardContent>
            </Card>
        </div>
        <div className="w-full p-4 shrink-0 md:w-1/4">
            {user && <Leaderboard gameId="brick-breaker" />}
        </div>
      </div>
    </AuthWrapper>
  );
}
