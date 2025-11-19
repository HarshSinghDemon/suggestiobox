'use client';

import { ConnectFourGame } from '@/components/game/connect-four';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ConnectFourGamePage() {
  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-start justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Connect Four</CardTitle>
            <CardDescription>Get four of your discs in a row, column, or diagonal to win!</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectFourGame />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
