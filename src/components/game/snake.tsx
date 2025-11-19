'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

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

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(getRandomCoordinate());
        setDirection('RIGHT');
        setIsGameOver(false);
        setScore(0);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': handleDirectionChange('UP'); break;
                case 'ArrowDown': handleDirectionChange('DOWN'); break;
                case 'ArrowLeft': handleDirectionChange('LEFT'); break;
                case 'ArrowRight': handleDirectionChange('RIGHT'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction]);

    useEffect(() => {
        if (isGameOver) return;

        const gameLoop = setInterval(() => {
            const newSnake = [...snake];
            const head = { ...newSnake[0] };

            switch (direction) {
                case 'UP': head.y -= 1; break;
                case 'DOWN': head.y += 1; break;
                case 'LEFT': head.x -= 1; break;
                case 'RIGHT': head.x += 1; break;
            }

            // Check for game over
            if (
                head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
                newSnake.some(segment => segment.x === head.x && segment.y === head.y)
            ) {
                setIsGameOver(true);
                return;
            }

            newSnake.unshift(head);

            // Check for food
            if (head.x === food.x && head.y === food.y) {
                setScore(s => s + 1);
                let newFoodPosition;
                do {
                    newFoodPosition = getRandomCoordinate();
                } while (newSnake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
                setFood(newFoodPosition);
            } else {
                newSnake.pop();
            }

            setSnake(newSnake);
        }, 150);

        return () => clearInterval(gameLoop);
    }, [snake, direction, food, isGameOver]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw grid
        ctx.strokeStyle = 'hsl(var(--muted) / 0.5)';
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                ctx.strokeRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }

        // Draw snake
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)';
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });

        // Draw food
        ctx.fillStyle = 'hsl(var(--destructive))';
        ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    }, [snake, food]);
    
    const handleDirectionChange = (newDirection: Direction) => {
        const oppositeDirections: Record<Direction, Direction> = {
            'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
        };
        if (direction !== oppositeDirections[newDirection]) {
            setDirection(newDirection);
        }
    };


    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="rounded-md bg-card-foreground/5"
                />
                {isGameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                        <p className="text-3xl font-bold text-destructive">Game Over</p>
                        <Button onClick={resetGame} size="sm" className="mt-4">
                            <RotateCcw className="w-4 h-4 mr-2"/>
                            Play Again
                        </Button>
                    </div>
                )}
            </div>
             <div className="flex items-center justify-between w-full">
                <p className="text-lg font-semibold">Score: <span className="font-bold text-primary">{score}</span></p>
                <Button onClick={resetGame} size="sm" variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2"/>
                    Reset
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 md:hidden">
                <div></div>
                <Button size="icon" onClick={() => handleDirectionChange('UP')}><ArrowUp /></Button>
                <div></div>
                <Button size="icon" onClick={() => handleDirectionChange('LEFT')}><ArrowLeft /></Button>
                <Button size="icon" onClick={() => handleDirectionChange('DOWN')}><ArrowDown /></Button>
                <Button size="icon" onClick={() => handleDirectionChange('RIGHT')}><ArrowRight /></Button>
            </div>
        </div>
    );
}
