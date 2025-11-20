
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { JamendoPlayer } from '@/components/jokebox/jamendo-player';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function JokeboxSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-24 h-10" />
            </div>
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
                        <Skeleton className="w-16 h-16" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function JokeboxPage() {
    const jamendoClientId = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID;

    return (
        <AuthWrapper>
            <div className="container py-8 mx-auto">
                <Card className="w-full max-w-2xl mx-auto overflow-hidden">
                    <div className="relative w-full h-48">
                        <Image
                            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                            alt="Jamendo hero image"
                            fill
                            className="object-cover"
                            data-ai-hint="music audio sound"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <CardTitle className="text-3xl font-bold">Jamendo Jukebox</CardTitle>
                            <CardDescription>Search and play music from Jamendo.</CardDescription>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <Suspense fallback={<JokeboxSkeleton />}>
                           {jamendoClientId ? (
                                <JamendoPlayer clientId={jamendoClientId} />
                           ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="w-4 h-4" />
                                <AlertTitle>Configuration Error</AlertTitle>
                                <AlertDescription>
                                    The Jamendo Client ID is not configured. Please set NEXT_PUBLIC_JAMENDO_CLIENT_ID in your environment variables.
                                </AlertDescription>
                            </Alert>
                           )}
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}
