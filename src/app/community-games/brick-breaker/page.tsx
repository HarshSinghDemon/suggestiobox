
'use client';

import { BrickBreakerGame } from '@/components/game/brick-breaker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function BrickBreakerPage() {
  return (
    <AuthWrapper>
      <div className="w-full h-[calc(100vh-4rem)] flex justify-center p-0">
          <Card className="w-full h-full flex flex-col rounded-none border-0">
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
