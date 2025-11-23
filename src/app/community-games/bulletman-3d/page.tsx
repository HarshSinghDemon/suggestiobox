
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Rocket } from 'lucide-react';

export default function Bulletman3DPage() {
  const gameUrl = "https://html5.gamemonetize.co/tjsii5r6qlrfyf34b076syz13lzeq0x1/";

  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Bulletman 3D</CardTitle>
                <CardDescription>
                  Take aim and shoot your way through challenging levels.
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
