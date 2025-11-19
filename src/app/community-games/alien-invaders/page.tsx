import { AlienInvaders } from '@/components/game/alien-invaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

export default function AlienInvadersPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Rocket className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Alien Invaders</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Defend the galaxy! Use arrow keys to move and space to shoot.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <AlienInvaders />
        </CardContent>
      </Card>
    </div>
  );
}
