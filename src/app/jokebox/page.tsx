'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Suspense } from 'react';
import { JokeboxPlayer } from '@/components/jokebox/jokebox-player';
import { Skeleton } from '@/components/ui/skeleton';
import { Music2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

function JokeboxSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="w-full h-10" />
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
                        <Skeleton className="w-12 h-12" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function JokeboxPage() {
    const jamendoClientId = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID;

    if (!jamendoClientId) {
        return (
            <AuthWrapper>
                <div className="container py-8 mx-auto">
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertTitle>Configuration Error</AlertTitle>
                        <AlertDescription>
                            The Jamendo Client ID is not configured. The music player cannot be loaded. Please set NEXT_PUBLIC_JAMENDO_CLIENT_ID in your .env file.
                        </AlertDescription>
                    </Alert>
                </div>
            </AuthWrapper>
        )
    }

    return (
        <AuthWrapper>
            <div className="container py-8 mx-auto">
                <Card className="w-full max-w-2xl mx-auto overflow-hidden">
                    <div className="relative h-48 w-full">
                        <Image
                            src="https://picsum.photos/seed/jokebox-hero/600/400"
                            alt="Jokebox hero image"
                            fill
                            className="object-cover"
                            data-ai-hint="music abstract vibrant"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <CardTitle className="text-3xl font-bold">Jokebox</CardTitle>
                            <CardDescription>Search for and play tracks from Jamendo.</CardDescription>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <Suspense fallback={<JokeboxSkeleton />}>
                            <JokeboxPlayer clientId={jamendoClientId} />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}
