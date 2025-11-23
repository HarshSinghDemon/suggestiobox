'use client';

import { CollaborativeCanvas } from '@/components/game/collaborative-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Palette } from 'lucide-react';

export default function CollaborativeCanvasPage() {
  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <Palette className="w-12 h-12 mx-auto mb-2 text-primary" />
            <CardTitle>Collaborative Canvas</CardTitle>
            <CardDescription>Draw on the canvas. Your creations will soon be visible to everyone in real-time!</CardDescription>
          </CardHeader>
          <CardContent>
            <CollaborativeCanvas />
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
