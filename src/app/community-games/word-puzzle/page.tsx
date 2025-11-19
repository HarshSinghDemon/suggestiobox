'use client';

import { WordPuzzleGame } from '@/components/game/word-puzzle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WordPuzzlePage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Word Puzzle</CardTitle>
          <CardDescription>Guess the 5-letter word in 6 tries.</CardDescription>
        </CardHeader>
        <CardContent>
          <WordPuzzleGame />
        </CardContent>
      </Card>
    </div>
  );
}
