import { RockPaperScissors } from '@/components/game/rock-paper-scissors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';

export default function CommunityGamePage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Community Game</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Play a game of Rock, Paper, Scissors!
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <RockPaperScissors />
        </CardContent>
      </Card>
    </div>
  );
}
