'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

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
                case 'ArrowUp': if(direction !== 'DOWN') setDirection('UP'); break;
                case 'ArrowDown': if(direction !== 'UP') setDirection('DOWN'); break;
                case 'ArrowLeft': if(direction !== 'RIGHT') setDirection('LEFT'); break;
                case 'ArrowRight': if(direction !== 'LEFT') setDirection('RIGHT'); break;
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

        // Draw snake
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.8)';
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
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="rounded-md bg-muted"
            />
             <div className="flex items-center justify-between w-full">
                <p className="font-semibold">Score: {score}</p>
                {isGameOver && (
                    <div className="text-center">
                        <p className="font-bold text-destructive">Game Over</p>
                        <Button onClick={resetGame} size="sm" className="mt-1">Play Again</Button>
                    </div>
                )}
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
