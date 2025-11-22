
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
import { RootLayoutContent } from './RootLayoutContent';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start-2p',
});

// Metadata must be exported from a Server Component.
export const metadata: Metadata = {
  title: 'The Suggestion Box | StudyShare',
  description: 'Upload and browse study materials, suggestions, and assignments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                <RootLayoutContent>
                    {children}
                </RootLayoutContent>
                <Toaster />
            </TooltipProvider>
          </AudioProvider>
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
