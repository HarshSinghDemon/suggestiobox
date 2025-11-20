
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
      <div className="container py-8 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="flex flex-col h-full">
                    <CardHeader className="text-center">
                        <CardTitle>Brick Breaker</CardTitle>
                        <CardDescription>Use your mouse or finger to move the paddle. Clear all the bricks!</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 min-h-[480px] lg:min-h-[600px]">
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
