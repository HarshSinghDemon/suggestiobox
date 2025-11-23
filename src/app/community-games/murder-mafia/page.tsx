
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Bomb } from 'lucide-react';

export default function MurderMafiaPage() {
  const gameUrl = "https://html5.gamemonetize.co/4zan7z32l5z63lmeo68xg3t3b7jvzmb0/";

  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/20">
                <Bomb className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Murder Mafia</CardTitle>
                <CardDescription>
                  Find the imposter among the crew. Complete your tasks or vote out the killer!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video rounded-lg overflow-hidden border">
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
