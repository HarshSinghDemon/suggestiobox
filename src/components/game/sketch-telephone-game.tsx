
'use client';

import type { SketchLobby } from '@/lib/types';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { CollaborativeCanvas } from './collaborative-canvas';
import { useState } from 'react';

export function SketchTelephoneGame({ lobby }: { lobby: SketchLobby }) {
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState<'writing' | 'drawing' | 'guessing'>('writing');
    const [prompt, setPrompt] = useState('');

    const handleSubmitPrompt = () => {
        if (prompt.trim()) {
            // In a real implementation, you'd save this prompt to Firestore
            // and advance the game state for the next player.
            setCurrentStep('drawing');
        }
    }

    return (
        <div className="container py-8 mx-auto">
             <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Sketch Telephone</CardTitle>
                    <CardDescription>A hilarious game of misinterpretation!</CardDescription>
                </CardHeader>
                <CardContent>
                    {currentStep === 'writing' && (
                        <div className="space-y-4 text-center">
                            <h3 className="text-lg font-semibold">It's your turn to write!</h3>
                            <p className="text-muted-foreground">Write a funny or weird sentence for the next person to draw.</p>
                            <Textarea 
                                placeholder="e.g., A monkey riding a unicycle on the moon" 
                                className="min-h-[100px]"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <Button onClick={handleSubmitPrompt}>Submit Prompt</Button>
                        </div>
                    )}
                    {currentStep === 'drawing' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-center">Now, draw this:</h3>
                            <blockquote className="p-4 text-center border-l-4">
                                "{prompt}"
                            </blockquote>
                            <CollaborativeCanvas />
                        </div>
                    )}
                    {/* 'guessing' and 'results' steps would be added here */}
                </CardContent>
            </Card>
        </div>
    );
}
