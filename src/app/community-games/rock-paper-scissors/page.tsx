import { RockPaperScissors } from '@/components/game/rock-paper-scissors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hand } from 'lucide-react';

export default function RockPaperScissorsPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Hand className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Rock, Paper, Scissors</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Can you beat the computer?
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <RockPaperScissors />
        </CardContent>
      </Card>
    </div>
  );
}
