'use client';

import { CollaborativeCanvas } from '@/components/game/collaborative-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Palette, PenTool } from 'lucide-react';

export default function CollaborativeCanvasPage() {
  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <PenTool className="w-12 h-12 mx-auto mb-2 text-primary" />
            <CardTitle>Scribble It!</CardTitle>
            <CardDescription>Draw the word you're given while others try to guess what it is!</CardDescription>
          </CardHeader>
          <CardContent>
            <CollaborativeCanvas />
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
