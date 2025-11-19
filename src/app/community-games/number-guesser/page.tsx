import { NumberGuesser } from '@/components/game/number-guesser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash } from 'lucide-react';

export default function NumberGuesserPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Hash className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Number Guesser</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Guess the number between 1 and 100.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <NumberGuesser />
        </CardContent>
      </Card>
    </div>
  );
}
