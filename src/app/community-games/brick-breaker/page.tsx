
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
      <div className="container flex-grow py-8 mx-auto">
        <div className="grid h-full grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-full">
                <Card className="flex flex-col h-full">
                    <CardHeader className="text-center">
                        <CardTitle>Brick Breaker</CardTitle>
                        <CardDescription>Use your mouse or finger to move the paddle. Clear all the bricks!</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <BrickBreakerGame />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                {user && <Leaderboard gameId="brick-breaker" />}
            </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
