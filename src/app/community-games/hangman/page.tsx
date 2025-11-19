'use client';

import { HangmanGame } from '@/components/game/hangman';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function HangmanPage() {
  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <div className="flex items-start justify-center">
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
      </div>
    </AuthWrapper>
  );
}
