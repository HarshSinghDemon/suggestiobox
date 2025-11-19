'use client';

import { FlappyBirdGame } from '@/components/game/flappy-bird';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function FlappyBirdPage() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl">
              <CardHeader className='text-center'>
                  <CardTitle>Flappy Bird</CardTitle>
                  <CardDescription>Click or press space to flap. Avoid the pipes!</CardDescription>
              </CardHeader>
              <CardContent>
                  <FlappyBirdGame />
              </CardContent>
          </Card>
      </div>
    </AuthWrapper>
  );
}
