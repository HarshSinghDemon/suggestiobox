'use client';

import { BrickBreakerGame } from '@/components/game/brick-breaker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function BrickBreakerPage() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Brick Breaker</CardTitle>
                <CardDescription>Use your mouse or finger to move the paddle. Clear all the bricks!</CardDescription>
            </CardHeader>
            <CardContent>
                <BrickBreakerGame />
            </CardContent>
        </Card>
    </div>
  );
}
