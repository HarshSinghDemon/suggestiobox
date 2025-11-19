'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GRID_SIZE = 20;

const getRandomCoordinate = () => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    return { x, y };
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState(getRandomCoordinate());
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    const [canvasSize, setCanvasSize] = useState(400);

    useEffect(() => {
        const handleResize = () => {
            const container = canvasRef.current?.parentElement;
            if (container) {
                setCanvasSize(Math.min(container.clientWidth, 400));
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const CELL_SIZE = canvasSize / GRID_SIZE;
    
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async () => {
        if (!user || !firestore || hasSubmittedScore || score === 0) return;

        try {
            const scoresCollection = collection(firestore, 'games', 'snake', 'scores');
            await addDocumentNonBlocking(scoresCollection, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userImage: user.photoURL,
                score: score,
                createdAt: serverTimestamp(),
            });
            setHasSubmittedScore(true);
            toast({
              title: "Score Submitted!",
              description: `Your score of ${score} has been saved.`,
            });
        } catch (error) {
            console.error("Error submitting score:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not submit your score.",
            });
        }
    }, [user, firestore, score, toast, hasSubmittedScore]);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(getRandomCoordinate());
        setDirection('RIGHT');
        setIsGameOver(false);
        setScore(0);
        setHasSubmittedScore(false);
    };

    const handleDirectionChange = useCallback((newDirection: Direction) => {
        if(isGameOver) return;
        setDirection((prevDirection) => {
            if (
                (newDirection === 'UP' && prevDirection === 'DOWN') ||
                (newDirection === 'DOWN' && prevDirection === 'UP') ||
                (newDirection === 'LEFT' && prevDirection === 'RIGHT') ||
                (newDirection === 'RIGHT' && prevDirection === 'LEFT')
            ) {
                return prevDirection;
            }
            return newDirection;
        });
    }, [isGameOver]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': handleDirectionChange('UP'); break;
                case 'ArrowDown': handleDirectionChange('DOWN'); break;
                case 'ArrowLeft': handleDirectionChange('LEFT'); break;
                case 'ArrowRight': handleDirectionChange('RIGHT'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDirectionChange]);

    useEffect(() => {
        if (isGameOver) {
            if (!hasSubmittedScore) {
                submitScore();
            }
            return;
        };

        const gameLoop = setInterval(() => {
            setSnake(prevSnake => {
                const newSnake = [...prevSnake];
                const head = { ...newSnake[0] };

                switch (direction) {
                    case 'UP': head.y -= 1; break;
                    case 'DOWN': head.y += 1; break;
                    case 'LEFT': head.x -= 1; break;
                    case 'RIGHT': head.x += 1; break;
                }

                if (
                    head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
                    newSnake.some(segment => segment.x === head.x && segment.y === head.y)
                ) {
                    setIsGameOver(true);
                    return prevSnake;
                }

                newSnake.unshift(head);

                if (head.x === food.x && head.y === food.y) {
                    setScore(s => s + 10);
                    let newFoodPosition;
                    do {
                        newFoodPosition = getRandomCoordinate();
                    } while (newSnake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
                    setFood(newFoodPosition);
                } else {
                    newSnake.pop();
                }
                return newSnake;
            });
        }, 150);

        return () => clearInterval(gameLoop);
    }, [snake, direction, food, isGameOver, hasSubmittedScore, submitScore]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        ctx.fillStyle = 'hsl(var(--card))';
        ctx.fillRect(0,0, canvasSize, canvasSize);

        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)';
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE -1, CELL_SIZE -1);
        });

        ctx.fillStyle = 'hsl(var(--destructive))';
        ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    }, [snake, food, canvasSize, CELL_SIZE]);
    
    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center md:col-span-2 gap-4">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize}
                        height={canvasSize}
                        className="rounded-md border"
                    />
                    {isGameOver && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80">
                            <p className="text-3xl font-bold text-destructive">Game Over</p>
                            <Button onClick={resetGame} size="sm" className="mt-4">
                                <RotateCcw className="w-4 h-4 mr-2"/>
                                Play Again
                            </Button>
                        </div>
                    )}
                </div>
                 <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
                    <div />
                    <Button size="lg" onClick={() => handleDirectionChange('UP')}><ArrowUp /></Button>
                    <div />
                    <Button size="lg" onClick={() => handleDirectionChange('LEFT')}><ArrowLeft /></Button>
                    <Button size="lg" onClick={() => handleDirectionChange('DOWN')}><ArrowDown /></Button>
                    <Button size="lg" onClick={() => handleDirectionChange('RIGHT')}><ArrowRight /></Button>
                </div>
            </div>
            <div className="space-y-4 md:col-span-1">
                 <div className="flex items-center justify-between w-full p-4 rounded-md bg-muted">
                    <p className="text-lg font-semibold">Score: <span className="font-bold text-primary">{score}</span></p>
                    <Button onClick={resetGame} size="sm" variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2"/>
                        Reset
                    </Button>
                </div>
                <Leaderboard gameId="snake" />
            </div>
        </div>
    );
}
