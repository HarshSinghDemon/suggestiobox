import { TicTacToe } from '@/components/game/tic-tac-toe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

export default function TicTacToePage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <X className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Tic-Tac-Toe</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Get three in a row to win.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <TicTacToe />
        </CardContent>
      </Card>
    </div>
  );
}
