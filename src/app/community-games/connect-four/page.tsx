'use client';

import { ConnectFourGame } from '@/components/game/connect-four';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ConnectFourPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Connect Four</CardTitle>
          <CardDescription>Try to get four of your colored discs in a row against the AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectFourGame />
        </CardContent>
      </Card>
    </div>
  );
}
