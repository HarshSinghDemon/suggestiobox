
'use client';

import { BrickBreakerGame } from '@/components/game/brick-breaker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function BrickBreakerPage() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Card className="w-full h-[calc(100vh-4rem)] rounded-none border-0">
              <CardHeader>
                  <CardTitle>Brick Breaker</CardTitle>
                  <CardDescription>Use your mouse or finger to move the paddle. Clear all the bricks!</CardDescription>
              </CardHeader>
              <CardContent>
                  <BrickBreakerGame />
              </CardContent>
          </Card>
      </div>
    </AuthWrapper>
  );
}
