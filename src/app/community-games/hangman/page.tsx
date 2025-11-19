import { Hangman } from '@/components/game/hangman';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages } from 'lucide-react';

export default function HangmanPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Languages className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Hangman</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Guess the word before you run out of attempts!
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <Hangman />
        </CardContent>
      </Card>
    </div>
  );
}
