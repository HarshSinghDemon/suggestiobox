'use client';

import { MemoryGame } from '@/components/game/memory-game';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MemoryGamePage() {
  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-start justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Memory Game</CardTitle>
            <CardDescription>Match all the pairs to win!</CardDescription>
          </CardHeader>
          <CardContent>
            <MemoryGame />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
