
'use client';

import type { ScribbleRoom } from '@/lib/types';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CollaborativeCanvas } from './collaborative-canvas';

export function ScribbleItGame({ room }: { room: ScribbleRoom }) {
    const { user } = useUser();
    
    return (
        <div className="container py-8 mx-auto">
             <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Scribble It!</CardTitle>
                    <CardDescription>Draw the word and have your friends guess!</CardDescription>
                </CardHeader>
                <CardContent>
                    <CollaborativeCanvas />
                </CardContent>
            </Card>
        </div>
    );
}
