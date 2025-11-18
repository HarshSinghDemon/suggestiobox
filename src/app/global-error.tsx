'use client';

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna } from 'lucide-react';
import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
      <FirebaseErrorListener />
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <Card className="max-w-md text-center">
            <CardHeader>
                <div className='flex justify-center mb-4'>
                    <Dna className="w-12 h-12 text-primary" />
                </div>
                <CardTitle>Something went wrong!</CardTitle>
                <CardDescription>{error.message || "An unexpected error occurred."}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    We've logged the issue and our team is looking into it. Please try refreshing the page. If the issue persists, contact support.
                </p>
                {typeof reset === 'function' && (
                  <Button onClick={() => reset()}>Try again</Button>
                )}
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
