
'use client';

import type { Metadata } from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Analytics } from '@vercel/analytics/react';
import { AudioProvider } from '@/components/layout/audio-provider';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start-2p',
});

// Metadata is defined in a function to be accessible in the component
export function generateMetadata(): Metadata {
  return {
    title: 'The Suggestion Box | StudyShare',
    description: 'Upload and browse study materials, suggestions, and assignments.',
  };
}

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith('/messages');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          inter.variable,
          pressStart2P.variable
        )}
      >
        <FirebaseClientProvider>
          <AudioProvider>
            <TooltipProvider>
                <div className="relative flex min-h-dvh flex-col">
                  <Header />
                  <main className={cn('flex-1', !isChatPage && 'pb-24')}>
                    {children}
                  </main>
                </div>
                <Toaster />
            </TooltipProvider>
          </AudioProvider>
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Since usePathname is a client hook, we need to wrap the layout in a client component.
  // We can't put 'use client' in the root layout directly as it would de-optimize the entire app.
  return (
    <RootLayoutContent>
        {children}
    </RootLayoutContent>
  );
}
