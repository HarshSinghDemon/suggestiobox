'use client';

import { TetrisGame } from '@/components/game/tetris';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TetrisPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
            <CardHeader className='text-center'>
                <CardTitle>Tetris</CardTitle>
                <CardDescription>Use arrow keys or on-screen buttons to move and rotate. Clear lines to score!</CardDescription>
            </CardHeader>
            <CardContent>
                <TetrisGame />
            </CardContent>
        </Card>
    </div>
  );
}

    