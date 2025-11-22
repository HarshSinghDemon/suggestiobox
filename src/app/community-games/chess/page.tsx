
'use client';

import { ChessGame } from '@/components/game/chess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function ChessGamePage() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            <CardTitle>Chess</CardTitle>
            <CardDescription>A classic game of strategy. Play against the AI with adjustable difficulty.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChessGame />
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
