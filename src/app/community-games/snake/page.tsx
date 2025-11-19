'use client';

import { SnakeGame } from '@/components/game/snake';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SnakePage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle>Snake</CardTitle>
          <CardDescription>Use arrow keys or on-screen buttons to move the snake and eat the food.</CardDescription>
        </CardHeader>
        <CardContent>
          <SnakeGame />
        </CardContent>
      </Card>
    </div>
  );
}

    