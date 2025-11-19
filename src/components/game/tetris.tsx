'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[1,0,0],[1,1,1]], // L
    [[0,0,1],[1,1,1]], // J
];

const COLORS = [
    '#000000', // 0 is empty
    '#3b82f6', // blue-500 for I
    '#facc15', // yellow-400 for O
    '#a855f7', // purple-500 for T
    '#22c55e', // green-500 for S
    '#ef4444', // red-500 for Z
    '#f97316', // orange-500 for L
    '#eab308', // amber-500 for J
];

const createEmptyBoard = (): number[][] => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export function TetrisGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [board, setBoard] = useState(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState(getRandomPiece());
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const lastTime = useRef(0);
    const dropCounter = useRef(0);
    const dropInterval = 1000;

    function getRandomPiece() {
        const randIndex = Math.floor(Math.random() * SHAPES.length);
        return {
            shape: SHAPES[randIndex],
            colorIndex: randIndex + 1,
            pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
        };
    }

    const resetGame = () => {
        setBoard(createEmptyBoard());
        setCurrentPiece(getRandomPiece());
        setScore(0);
        setIsGameOver(false);
        lastTime.current = 0;
        dropCounter.current = 0;
    };
    
    const isValidMove = (piece: { shape: number[][], pos: {x:number, y:number} }, newPos: {x:number, y:number}, newShape?: number[][]) => {
        const shape = newShape || piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = newPos.x + x;
                    const newY = newPos.y + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || (board[newY] && board[newY][newX] !== 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    const movePiece = (dx: number) => {
        const newPos = { x: currentPiece.pos.x + dx, y: currentPiece.pos.y };
        if (isValidMove(currentPiece, newPos)) {
            setCurrentPiece(prev => ({ ...prev, pos: newPos }));
        }
    };
    
    const dropPiece = () => {
        const newPos = { x: currentPiece.pos.x, y: currentPiece.pos.y + 1 };
        if (isValidMove(currentPiece, newPos)) {
            setCurrentPiece(prev => ({ ...prev, pos: newPos }));
        } else {
            // Lock piece and create new one
            const newBoard = board.map(row => [...row]);
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        newBoard[currentPiece.pos.y + y][currentPiece.pos.x + x] = currentPiece.colorIndex;
                    }
                });
            });

            // Clear lines
            let linesCleared = 0;
            for (let y = newBoard.length - 1; y >= 0; y--) {
                if (newBoard[y].every(val => val !== 0)) {
                    linesCleared++;
                    newBoard.splice(y, 1);
                    newBoard.unshift(Array(COLS).fill(0));
                    y++; // Re-check the same row index
                }
            }
            if(linesCleared > 0) {
                 setScore(s => s + linesCleared * 100 * linesCleared);
            }

            setBoard(newBoard);
            const newPiece = getRandomPiece();
            if (!isValidMove(newPiece, newPiece.pos)) {
                setIsGameOver(true);
            } else {
                setCurrentPiece(newPiece);
            }
        }
    };
    
    const rotatePiece = () => {
        const shape = currentPiece.shape;
        const newShape: number[][] = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        if (isValidMove(currentPiece, currentPiece.pos, newShape)) {
            setCurrentPiece(prev => ({ ...prev, shape: newShape }));
        }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isGameOver) return;
        switch (e.key) {
            case 'ArrowLeft': e.preventDefault(); movePiece(-1); break;
            case 'ArrowRight': e.preventDefault(); movePiece(1); break;
            case 'ArrowDown': e.preventDefault(); dropPiece(); break;
            case 'ArrowUp': e.preventDefault(); rotatePiece(); break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPiece, board, isGameOver]);
    
    useEffect(() => {
        let animationFrameId: number;
        
        const update = (time = 0) => {
            if (isGameOver) return;
            const deltaTime = time - lastTime.current;
            lastTime.current = time;
            dropCounter.current += deltaTime;
            if (dropCounter.current > dropInterval) {
                dropPiece();
                dropCounter.current = 0;
            }
            draw();
            animationFrameId = requestAnimationFrame(update);
        }
        
        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw board
            board.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        ctx.fillStyle = COLORS[value];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
            
            // Draw current piece
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillStyle = COLORS[currentPiece.colorIndex];
                        ctx.fillRect((currentPiece.pos.x + x) * BLOCK_SIZE, (currentPiece.pos.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
        };
        
        resetGame();
        update();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);


    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <canvas 
                    ref={canvasRef} 
                    width={COLS * BLOCK_SIZE} 
                    height={ROWS * BLOCK_SIZE}
                    className="rounded-md bg-card-foreground/10 border border-border"
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
                <p className="font-semibold">Score: {score}</p>
                <Button onClick={resetGame} size="sm" variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2"/>
                    Reset
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 md:hidden">
                <Button size="icon" onClick={() => movePiece(-1)}><ArrowLeft/></Button>
                <Button size="icon" onClick={() => rotatePiece()}><RotateCw/></Button>
                <Button size="icon" onClick={() => movePiece(1)}><ArrowRight/></Button>
                <div />
                <Button size="icon" onClick={() => dropPiece()}><ArrowDown/></Button>
                <div />
            </div>
        </div>
    );
}
