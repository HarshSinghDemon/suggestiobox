import { WordPuzzle } from '@/components/game/word-puzzle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Puzzle } from 'lucide-react';

export default function WordPuzzlePage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Puzzle className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Word Puzzle</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Guess the 5-letter word in 6 tries.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <WordPuzzle />
        </CardContent>
      </Card>
    </div>
  );
}
