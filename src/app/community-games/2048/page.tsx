'use client';

import { Game2048 } from '@/components/game/2048';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function Game2048Page() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>2048</CardTitle>
            <CardDescription>Use arrow keys or swipe to slide tiles. Combine them to reach 2048!</CardDescription>
          </CardHeader>
          <CardContent>
            <Game2048 />
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
