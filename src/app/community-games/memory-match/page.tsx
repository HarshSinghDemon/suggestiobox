import { MemoryMatch } from '@/components/game/memory-match';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export default function MemoryMatchPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Memory Match</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Find all the matching pairs!
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <MemoryMatch />
        </CardContent>
      </Card>
    </div>
  );
}
