'use client';

import { PongGame } from '@/components/game/pong';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function PongGamePage() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle>Pong</CardTitle>
            <CardDescription>Use your mouse or W/S keys to control the paddle. First to 5 points wins!</CardDescription>
          </CardHeader>
          <CardContent>
            <PongGame />
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
