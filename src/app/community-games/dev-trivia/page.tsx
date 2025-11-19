import { DevTrivia } from '@/components/game/dev-trivia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function DevTriviaPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Developer Trivia</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Test your tech knowledge!
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <DevTrivia />
        </CardContent>
      </Card>
    </div>
  );
}
