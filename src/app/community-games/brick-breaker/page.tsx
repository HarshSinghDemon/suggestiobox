
'use client';

import { BrickBreakerGame } from '@/components/game/brick-breaker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function BrickBreakerPage() {
  return (
    <AuthWrapper>
      <div className="w-full h-[calc(100vh-4rem)]">
          <Card className="flex flex-col w-full h-full border-0 rounded-none">
              <CardHeader className="text-center">
                  <CardTitle>Brick Breaker</CardTitle>
                  <CardDescription>Use your mouse or finger to move the paddle. Clear all the bricks!</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                  <BrickBreakerGame />
              </CardContent>
          </Card>
      </div>
    </AuthWrapper>
  );
}
