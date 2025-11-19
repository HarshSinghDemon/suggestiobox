'use client';

import { RockPaperScissorsGame } from '@/components/game/rock-paper-scissors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RockPaperScissorsPage() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle>Rock Paper Scissors</CardTitle>
          <CardDescription>Challenge a friend or the CPU! First to 5 points wins.</CardDescription>
        </CardHeader>
        <CardContent>
          <RockPaperScissorsGame />
        </CardContent>
      </Card>
    </div>
  );
}
