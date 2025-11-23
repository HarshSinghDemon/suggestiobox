
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Swords, Smartphone } from 'lucide-react';

export default function NinjasBladePage() {
  const gameUrl = "https://html5.gamemonetize.co/4zan7z32l5z63lmeo68xg3t3b7jvzmb0/";

  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Swords className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Ninja's Blade</CardTitle>
                <CardDescription>
                  Slice through your enemies in this action-packed ninja game.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video rounded-lg overflow-hidden border relative">
                <div className="absolute inset-0 z-10 flex-col items-center justify-center hidden p-4 text-center bg-background/90 md:hidden portrait:flex">
                    <Smartphone className="w-16 h-16 mb-4 text-primary animate-pulse" />
                    <h3 className="text-xl font-bold">Rotate Your Device</h3>
                    <p className="text-muted-foreground">For the best experience, please play this game in landscape mode.</p>
                </div>
                <iframe
                    src={gameUrl}
                    width="100%"
                    height="100%"
                    scrolling="no"
                    allowFullScreen
                    className='border-0'
                ></iframe>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
