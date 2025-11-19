'use client';

import { MinesweeperGame } from '@/components/game/minesweeper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MinesweeperPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Minesweeper</CardTitle>
          <CardDescription>Click to reveal, right-click to flag. Don't hit the bombs!</CardDescription>
        </CardHeader>
        <CardContent>
          <MinesweeperGame />
        </CardContent>
      </Card>
    </div>
  );
}
