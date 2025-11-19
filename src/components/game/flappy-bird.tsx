'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';

export function FlappyBirdGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState(0);
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const submitScore = useCallback(async (finalScore: number) => {
        if (!user || !firestore || finalScore === 0 || hasSubmittedScore) return;

        try {
            const scoresCollection = collection(firestore, 'games', 'flappy-bird', 'scores');
            await addDocumentNonBlocking(scoresCollection, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userImage: user.photoURL,
                score: finalScore,
                createdAt: serverTimestamp(),
            });
            setHasSubmittedScore(true);
            toast({
              title: "Score Submitted!",
              description: `Your score of ${finalScore} has been saved.`,
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 320;
        canvas.height = 480;

        let bird = { x: 50, y: 150, width: 34, height: 24, gravity: 0.3, lift: -6, velocity: 0 };
        let pipes: { x: number, y: number, width: number, height: number, passed: boolean }[] = [];
        let pipeWidth = 52;
        let pipeGap = 150;
        let frameCount = 0;
        let localScore = 0;
        let animationFrameId: number;
        
        const resetGame = () => {
            bird = { x: 50, y: 150, width: 34, height: 24, gravity: 0.3, lift: -6, velocity: 0 };
            pipes = [];
            frameCount = 0;
            localScore = 0;
            setScore(0);
            setHasSubmittedScore(false);
            setGameState('playing');
        };

        const flap = () => {
            if (gameState === 'start') {
                resetGame();
            }
            if (gameState !== 'gameOver') {
                bird.velocity = bird.lift;
            }
        };

        const handleClick = () => flap();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                flap();
            }
        };

        canvas.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (gameState === 'start') {
                ctx.fillStyle = 'black';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Click or Space to Start', canvas.width / 2, canvas.height / 2);
                animationFrameId = requestAnimationFrame(draw);
                return;
            }
            
            // Bird
            bird.velocity += bird.gravity;
            bird.y += bird.velocity;
            ctx.fillStyle = '#facc15'; // yellow-400
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

            // Pipes
            if (frameCount % 120 === 0) {
                const pipeY = Math.random() * (canvas.height - pipeGap - 120) + 60;
                pipes.push({ x: canvas.width, y: 0, width: pipeWidth, height: pipeY, passed: false });
                pipes.push({ x: canvas.width, y: pipeY + pipeGap, width: pipeWidth, height: canvas.height - pipeY - pipeGap, passed: true });
            }

            pipes.forEach(pipe => {
                pipe.x -= 2;
                ctx.fillStyle = '#4ade80'; // green-400
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
                
                // Collision
                if (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x &&
                    bird.y < pipe.y + pipe.height && bird.y + bird.height > pipe.y) {
                    setGameState('gameOver');
                    submitScore(localScore);
                }
                
                // Score
                if (!pipe.passed && bird.x > pipe.x + pipe.width) {
                    pipe.passed = true;
                    localScore++;
                    setScore(localScore);
                }
            });

            pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
            
            // Ground collision
            if (bird.y + bird.height > canvas.height || bird.y < 0) {
                setGameState('gameOver');
                submitScore(localScore);
            }
            
            frameCount++;
            if (gameState === 'playing') {
                animationFrameId = requestAnimationFrame(draw);
            } else if (gameState === 'gameOver') {
                 ctx.fillStyle = 'black';
                 ctx.font = '30px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 20);
                 ctx.font = '20px Arial';
                 ctx.fillText(`Score: ${localScore}`, canvas.width/2, canvas.height/2 + 20);
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameState, submitScore]);

    const handleRestart = () => {
        setGameState('start');
        setScore(0);
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center col-span-1 md:col-span-2">
                <canvas ref={canvasRef} className="rounded-md bg-sky-300" />
                <div className="flex items-center justify-between w-full max-w-sm mt-4">
                    <p className="font-semibold text-lg">Score: {score}</p>
                    {gameState === 'gameOver' && (
                        <Button onClick={handleRestart} size="sm">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Play Again
                        </Button>
                    )}
                </div>
            </div>
            <div className="col-span-1">
                <Leaderboard gameId="flappy-bird" />
            </div>
        </div>
    );
}

    