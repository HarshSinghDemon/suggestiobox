import { BrickBreaker } from '@/components/game/brick-breaker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';

export default function BrickBreakerPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Palette className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Brick Breaker</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Clear all the bricks. Use your mouse to move the paddle.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <BrickBreaker />
        </CardContent>
      </Card>
    </div>
  );
}
