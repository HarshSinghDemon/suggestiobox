'use client';

import { HangmanGame } from '@/components/game/hangman';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HangmanPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Hangman</CardTitle>
          <CardDescription>Guess the word before the man is hanged!</CardDescription>
        </CardHeader>
        <CardContent>
          <HangmanGame />
        </CardContent>
      </Card>
    </div>
  );
}
