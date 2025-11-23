
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';

export function DoodleJumperGame() {
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
            const scoresCollection = collection(firestore, 'games', 'doodle-jumper', 'scores');
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
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = Math.min(container.clientWidth, 400);
                canvas.height = container.clientHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        let player = { x: canvas.width / 2, y: canvas.height - 50, width: 40, height: 40, dy: 0, gravity: 0.2, jump: -7 };
        let platforms: { x: number, y: number, width: number, height: number }[] = [];
        let score = 0;
        let cameraY = 0;
        
        for (let i = 0; i < 10; i++) {
            platforms.push({
                x: Math.random() * (canvas.width - 60),
                y: canvas.height - 70 * i,
                width: 60,
                height: 10
            });
        }
        
        let leftPressed = false;
        let rightPressed = false;

        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') leftPressed = true;
            if (e.key === 'ArrowRight') rightPressed = true;
        };
        const keyUpHandler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') leftPressed = false;
            if (e.key === 'ArrowRight') rightPressed = false;
        };
        const mouseMoveHandler = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            player.x = e.clientX - rect.left;
        };

        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);

        let animationFrameId: number;

        function gameLoop() {
            // Update player
            player.dy += player.gravity;
            player.y += player.dy;

            if (leftPressed) player.x -= 4;
            if (rightPressed) player.x += 4;
            
            if (player.x > canvas.width) player.x = 0;
            if (player.x < 0) player.x = canvas.width;

            // Camera follow
            if (player.y < canvas.height / 2 + cameraY) {
                cameraY = player.y - canvas.height / 2;
            }
            
            // Collision with platforms
            if (player.dy > 0) {
                platforms.forEach(platform => {
                    if (player.x < platform.x + platform.width &&
                        player.x + player.width > platform.x &&
                        player.y + player.height > platform.y - cameraY &&
                        player.y + player.height < platform.y - cameraY + platform.height) {
                        player.dy = player.jump;
                    }
                });
            }

            // Generate new platforms
            if (platforms[platforms.length - 1].y > cameraY - canvas.height) {
                score += 10;
                setScore(score);
                platforms.push({
                    x: Math.random() * (canvas.width - 60),
                    y: platforms[platforms.length - 1].y - (70 + Math.random() * 30),
                    width: 60,
                    height: 10
                });
                platforms.shift();
            }

            // Game over
            if (player.y - cameraY > canvas.height) {
                setGameState('gameOver');
                submitScore(score);
            }

            // Draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(0, -cameraY);

            // Draw player
            ctx.fillStyle = 'green';
            ctx.fillRect(player.x, player.y, player.width, player.height);

            // Draw platforms
            ctx.fillStyle = 'brown';
            platforms.forEach(platform => {
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            });

            ctx.restore();
            
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        gameLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            canvas.removeEventListener('mousemove', mouseMoveHandler);
        };
    }, [gameState, submitScore]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setHasSubmittedScore(false);
    };

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="bg-sky-200" />
            {gameState !== 'playing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center bg-black/50">
                    <h2 className="text-3xl font-bold text-white">{gameState === 'start' ? 'Doodle Jumper' : 'Game Over'}</h2>
                    <p className="text-lg text-white">Score: {score}</p>
                    <Button onClick={startGame}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {gameState === 'start' ? 'Start Game' : 'Play Again'}
                    </Button>
                </div>
            )}
        </div>
    );
}
