
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Using require for the image to work with Next.js build process for local files
const moleImgSrc = "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/mole.png";
const holeImgSrc = "https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/hole.png";


export function WhacAMoleGame() {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [activeMole, setActiveMole] = useState<number | null>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async (finalScore: number) => {
        if (!user || !firestore || finalScore === 0 || hasSubmittedScore) return;

        try {
            const scoresCollection = collection(firestore, 'games', 'whac-a-mole', 'scores');
            await addDocumentNonBlocking(scoresCollection, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userImage: user.photoURL,
                score: finalScore,
                createdAt: serverTimestamp(),
            });
            setHasSubmittedScore(true);
            toast({
              title: "Game Over!",
              description: `Your score of ${finalScore} has been submitted.`,
            });
        } catch (error) {
            console.error("Error submitting score:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not submit your score.",
            });
        }
    }, [user, firestore, toast, hasSubmittedScore]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setGameState('gameOver');
            setActiveMole(null);
            submitScore(score);
        }
    }, [gameState, timeLeft, score, submitScore]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const interval = setInterval(() => {
            setActiveMole(Math.floor(Math.random() * 9));
        }, 700);

        return () => clearInterval(interval);
    }, [gameState]);

    const handleWhack = (index: number) => {
        if (index === activeMole) {
            setScore(s => s + 10);
            setActiveMole(null);
        }
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setActiveMole(null);
        setGameState('playing');
        setHasSubmittedScore(false);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex justify-around w-full max-w-sm p-4 rounded-lg bg-muted">
                <div className="text-center">
                    <div className="text-sm font-semibold">SCORE</div>
                    <div className="text-2xl font-bold text-primary">{score}</div>
                </div>
                <div className="text-center">
                    <div className="text-sm font-semibold">TIME LEFT</div>
                    <div className="text-2xl font-bold text-destructive">{timeLeft}</div>
                </div>
            </div>
            
            <div className="relative grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                    <div 
                        key={i} 
                        className="relative w-24 h-24 sm:w-32 sm:h-32 cursor-pointer"
                        onClick={() => handleWhack(i)}
                    >
                        <img src={holeImgSrc} alt="Hole" className="absolute bottom-0 z-10 w-full" />
                        <img 
                            src={moleImgSrc}
                            alt="Mole"
                            className={cn(
                                "absolute bottom-0 z-0 w-full transition-all duration-150 ease-out",
                                activeMole === i ? "transform -translate-y-1/2" : "transform translate-y-full"
                            )}
                        />
                    </div>
                ))}
            </div>

            {gameState !== 'playing' && (
                <Button onClick={startGame} size="lg">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {gameState === 'start' ? 'Start Game' : 'Play Again'}
                </Button>
            )}
        </div>
    );
}
