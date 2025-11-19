'use client';

import { AlienInvadersGame } from '@/components/game/alien-invaders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AlienInvadersPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Alien Invaders</CardTitle>
          <CardDescription>Use the arrow keys to move and space to shoot. Defend the galaxy!</CardDescription>
        </CardHeader>
        <CardContent>
          <AlienInvadersGame />
        </CardContent>
      </Card>
    </div>
  );
}
