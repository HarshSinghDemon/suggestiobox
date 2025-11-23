
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Rocket, Expand } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function Bulletman3DPage() {
  const gameUrl = "https://html5.gamemonetize.co/tjsii5r6qlrfyf34b076syz13lzeq0x1/";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

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
            <div className="w-full aspect-[4/3] sm:aspect-video rounded-lg overflow-hidden border">
                <iframe
                    ref={iframeRef}
                    src={gameUrl}
                    width="100%"
                    height="100%"
                    scrolling="no"
                    allowFullScreen
                    className='border-0'
                ></iframe>
            </div>
             <div className="flex justify-end mt-2">
                <Button variant="outline" onClick={handleFullscreen}>
                    <Expand className="w-4 h-4 mr-2" />
                    Fullscreen
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
