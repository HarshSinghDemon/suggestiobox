'use client';

import { CheckersGame } from '@/components/game/checkers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function CheckersGamePage() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Checkers</CardTitle>
            <CardDescription>Capture all your opponent's pieces. You can only move diagonally.</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckersGame />
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
