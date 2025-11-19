'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Award, RotateCcw } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';

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
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    const touchStart = useRef<{ x: number, y: number } | null>(null);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async () => {
        if (!user || !firestore || hasSubmittedScore || score === 0) return;
    
        try {
          const scoresCollection = collection(firestore, 'games', '2048', 'scores');
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
      }, [user, firestore, score, hasSubmittedScore, toast]);
    
    const resetGame = () => {
        setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
        setScore(0);
        setIsGameOver(false);
        setIsWinner(false);
        setHasSubmittedScore(false);
    };

    const checkForGameOver = (currentBoard: number[]) => {
        const hasEmpty = currentBoard.includes(0);
        if (hasEmpty) return false;

        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                const current = currentBoard[i * SIZE + j];
                if (j < SIZE - 1 && current === currentBoard[i * SIZE + j + 1]) return false;
                if (i < SIZE - 1 && current === currentBoard[(i + 1) * SIZE + j]) return false;
            }
        }
        return true;
    }

    const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (isGameOver) return;
        let newBoard = [...board];
        let newScore = score;
        let moved = false;
        
        const rotateBoard = (b: number[]) => {
            const rotated = createEmptyBoard();
            for(let i=0; i<SIZE; i++) for(let j=0; j<SIZE; j++) rotated[i*SIZE+j] = b[(SIZE-1-j)*SIZE+i];
            return rotated;
        }
        
        let rotations = 0;
        if(direction === 'up') rotations = 1;
        if(direction === 'right') rotations = 0; // The logic slides left, so right is 2 rotations
        if(direction === 'left') rotations = 2; // and left is 0, but this is a bit confusing
        if(direction === 'down') rotations = 3; // Let's fix this for clarity

        if (direction === 'up') rotations = 3;
        if (direction === 'right') rotations = 2;
        if (direction === 'down') rotations = 1;
        if (direction === 'left') rotations = 0;

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

        for(let i=0; i< (4-rotations) % 4; i++) newBoard = rotateBoard(newBoard);
        
        if (moved) {
            const finalBoard = addRandomTile(newBoard);
            setBoard(finalBoard);
            setScore(newScore);

            if(checkForGameOver(finalBoard)) {
                setIsGameOver(true);
            }
        }
    }, [board, score, isGameOver]);

    useEffect(() => {
        if(isGameOver && !hasSubmittedScore) {
            submitScore();
        }
    }, [isGameOver, hasSubmittedScore, submitScore]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': move('up'); break;
                case 'ArrowDown': move('down'); break;
                case 'ArrowLeft': move('left'); break;
                case 'ArrowRight': move('right'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current || isGameOver) return;
        if(e.changedTouches.length > 0) {
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    move(dx > 0 ? 'right' : 'left');
                } else {
                    move(dy > 0 ? 'down' : 'up');
                }
            }
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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div 
                className="relative p-2 rounded-md bg-card-foreground/20 touch-none md:col-span-2"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="grid grid-cols-4 gap-2">
                    {board.map((val, i) => (
                        <div key={i} className={cn(
                            "w-full aspect-square flex items-center justify-center text-xl sm:text-3xl font-bold rounded-md transition-all duration-100",
                            TILE_COLORS[val] || 'bg-purple-600 text-white'
                        )}>
                            {val > 0 && val}
                        </div>
                    ))}
                </div>
                {(isGameOver || isWinner) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80">
                        <Award className={cn("w-16 h-16", isWinner ? "text-yellow-500" : "text-destructive")} />
                        <h2 className="text-3xl font-bold">{isWinner ? "You Win!" : "Game Over"}</h2>
                        <Button onClick={resetGame} className="mt-4">Play Again</Button>
                    </div>
                )}
            </div>
            <div className="space-y-4 md:col-span-1">
                <div className="flex justify-between w-full p-4 rounded-md bg-muted">
                    <div className="text-center">
                        <div className="text-sm font-semibold">SCORE</div>
                        <div className="text-2xl font-bold">{score}</div>
                    </div>
                    <Button onClick={resetGame} variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2"/>
                        New Game
                    </Button>
                </div>
                <Leaderboard gameId="2048" />
            </div>
        </div>
    );
}
