'use client';

import { TicTacToeGame } from '@/components/game/tic-tac-toe';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TicTacToePage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Tic-Tac-Toe</CardTitle>
          <CardDescription>Can you beat the computer?</CardDescription>
        </CardHeader>
        <CardContent>
          <TicTacToeGame />
        </CardContent>
      </Card>
    </div>
  );
}

    