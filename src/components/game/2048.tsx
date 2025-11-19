'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Award, RotateCcw } from 'lucide-react';

const SIZE = 4;
const WIN_TILE = 2048;

const createEmptyBoard = () => Array(SIZE * SIZE).fill(0);

const addRandomTile = (board: number[]) => {
    const newBoard = [...board];
    const emptyTiles = newBoard.map((val, i) => (val === 0 ? i : -1)).filter(i => i !== -1);
    if (emptyTiles.length === 0) return newBoard;
    
    const randomIndex = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    newBoard[randomIndex] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
};

export function Game2048() {
    const [board, setBoard] = useState(() => addRandomTile(addRandomTile(createEmptyBoard())));
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const touchStart = useRef<{ x: number, y: number } | null>(null);

    const resetGame = () => {
        setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
        setScore(0);
        setIsGameOver(false);
        setIsWinner(false);
    };

    const move = (direction: 'up' | 'down' | 'left' | 'right') => {
        let newBoard = [...board];
        let newScore = score;
        let moved = false;
        
        const rotateBoard = (b: number[]) => {
            const rotated = createEmptyBoard();
            for(let i=0; i<SIZE; i++) for(let j=0; j<SIZE; j++) rotated[i*SIZE+j] = b[(SIZE-1-j)*SIZE+i];
            return rotated;
        }
        
        let rotations = 0;
        if(direction === 'up') rotations = 3;
        if(direction === 'right') rotations = 2;
        if(direction === 'down') rotations = 1;
        
        for(let i=0; i<rotations; i++) newBoard = rotateBoard(newBoard);

        for (let i = 0; i < SIZE; i++) {
            const row = newBoard.slice(i * SIZE, (i + 1) * SIZE);
            const newRow = row.filter(val => val !== 0);
            for (let j = 0; j < newRow.length - 1; j++) {
                if (newRow[j] === newRow[j+1]) {
                    newRow[j] *= 2;
                    newScore += newRow[j];
                    if (newRow[j] === WIN_TILE) setIsWinner(true);
                    newRow.splice(j + 1, 1);
                }
            }
            while(newRow.length < SIZE) newRow.push(0);
            for(let j=0; j<SIZE; j++) {
                if(newBoard[i*SIZE+j] !== newRow[j]) moved = true;
                newBoard[i*SIZE+j] = newRow[j];
            }
        }

        for(let i=0; i<rotations; i++) newBoard = rotateBoard(rotateBoard(rotateBoard(newBoard)));

        if (moved) {
            const finalBoard = addRandomTile(newBoard);
            setBoard(finalBoard);
            setScore(newScore);

            const hasEmpty = finalBoard.includes(0);
            if (!hasEmpty) {
                let canMove = false;
                for (let i = 0; i < SIZE; i++) {
                    for (let j = 0; j < SIZE; j++) {
                        const current = finalBoard[i * SIZE + j];
                        if (j < SIZE - 1 && current === finalBoard[i * SIZE + j + 1]) canMove = true;
                        if (i < SIZE - 1 && current === finalBoard[(i + 1) * SIZE + j]) canMove = true;
                    }
                }
                if (!canMove) setIsGameOver(true);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGameOver) return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); move('up'); break;
                case 'ArrowDown': e.preventDefault(); move('down'); break;
                case 'ArrowLeft': e.preventDefault(); move('left'); break;
                case 'ArrowRight': e.preventDefault(); move('right'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [board, isGameOver]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current || isGameOver) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) move('right');
            else if (dx < -30) move('left');
        } else {
            if (dy > 30) move('down');
            else if (dy < -30) move('up');
        }
        touchStart.current = null;
    };


    const TILE_COLORS: Record<number, string> = {
        0: 'bg-muted/50', 2: 'bg-blue-100 text-gray-900', 4: 'bg-blue-200 text-gray-900',
        8: 'bg-green-300 text-white', 16: 'bg-green-400 text-white', 32: 'bg-yellow-400 text-white',
        64: 'bg-yellow-500 text-white', 128: 'bg-orange-400 text-white', 256: 'bg-orange-500 text-white',
        512: 'bg-red-400 text-white', 1024: 'bg-red-500 text-white', 2048: 'bg-purple-500 text-white',
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full p-2 rounded-md bg-muted">
                <div className="text-center">
                    <div className="text-sm font-semibold">SCORE</div>
                    <div className="text-2xl font-bold">{score}</div>
                </div>
                <Button onClick={resetGame} variant="outline" size="icon">
                    <RotateCcw className="w-5 h-5"/>
                </Button>
            </div>
            <div 
                className="relative p-2 rounded-md bg-muted-foreground/50 touch-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="grid grid-cols-4 gap-2">
                    {board.map((val, i) => (
                        <div key={i} className={cn(
                            "w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-xl sm:text-3xl font-bold rounded-md transition-all duration-100",
                             TILE_COLORS[val] || 'bg-purple-600 text-white'
                        )}>
                            {val > 0 && val}
                        </div>
                    ))}
                </div>
                {(isGameOver || isWinner) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                        <Award className={cn("w-16 h-16", isWinner ? "text-yellow-500" : "text-destructive")} />
                        <h2 className="text-3xl font-bold">{isWinner ? "You Win!" : "Game Over"}</h2>
                        <Button onClick={resetGame} className="mt-4">Play Again</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
