'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const WavyBackground = dynamic(() => import('@/components/wavy-background').then(mod => mod.WavyBackground), {
  loading: () => <Skeleton className="absolute inset-0" />,
});

export default function Home() {
  const handleGameClick = () => {
    const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_2b2899dbb0.mp3");
    audio.play();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 bg-background text-foreground">
      <WavyBackground 
        className="w-full max-w-4xl mx-auto"
        waveWidth={60}
        waveOpacity={0.6}
        speed="fast"
        colors={['#FFD700', '#FFA500', '#FF4500', '#DC143C', '#B22222']}
      >
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-arcade tracking-tighter leading-relaxed [text-shadow:0_2px_hsl(45_100%_50%/0.6),0_4px_hsl(35_100%_50%/0.5),0_6px_hsl(25_100%_50%/0.4),0_8px_hsl(15_100%_50%/0.3),0_10px_15px_hsl(260_80%_40%/0.1),0_12px_20px_hsl(260_80%_40%/0.1)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 bg-[length:200%_auto] animate-shine">
                The
                <br />
                Suggestion
                <br />
                Box
            </span>
          </h1>
          <div className="max-w-lg space-y-4">
            <p className="text-lg text-foreground/80">
              Your hub for academic success and community fun. Share notes, drop suggestions, and connect with classmates in our community chat.
            </p>
            <p className="text-lg text-foreground/80">
              When it's time for a break, jump into the arcade for some retro gaming. Learn, share, and play together!
            </p>
          </div>
          <div className="flex flex-col items-center justify-center w-full gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Link href="/suggestions/new" prefetch={true}>
                      Give a Suggestion
                      <ChevronRight className="w-6 h-6 ml-2" />
                  </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-full px-8 py-6 text-lg">
                  <Link href="/browse" prefetch={true}>
                      Explore Content
                      <ChevronRight className="w-6 h-6 ml-2" />
                  </Link>
              </Button>
            </div>
            <div onClick={handleGameClick}>
                <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg font-arcade animate-pulse-scale hover:animate-shake shadow-lg shadow-orange-500/30 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white bg-[length:200%_auto] animate-wave">
                    <Link href="/community-game" prefetch={true}>
                        Play Games
                        <Gamepad2 className="w-6 h-6 ml-2" />
                    </Link>
                </Button>
            </div>
          </div>
          <div className="pt-8">
            <p className="text-sm text-foreground/60 font-arcade">
                Made with ❤️ by sectionB
            </p>
          </div>
        </div>
      </WavyBackground>
    </div>
  );
}
