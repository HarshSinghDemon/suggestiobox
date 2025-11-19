'use client';

import { PacManGame } from '@/components/game/pac-man';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PacManGamePage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Pac-Man</CardTitle>
          <CardDescription>Use arrow keys or swipe to move. Eat all the dots and avoid the ghosts!</CardDescription>
        </CardHeader>
        <CardContent>
          <PacManGame />
        </CardContent>
      </Card>
    </div>
  );
}
