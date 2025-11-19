'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { RotateCcw, Award } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import sudoku from 'sudoku';

type Level = 'easy' | 'medium' | 'hard' | 'very-hard'; // Removed insane and inhuman as they often timed out

export function SudokuGame() {
    const [level, setLevel] = useState<Level>('easy');
    const [puzzle, setPuzzle] = useState<number[][] | null>(null);
    const [solution, setSolution] = useState<number[][] | null>(null);
    const [playerBoard, setPlayerBoard] = useState<number[][] | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [time, setTime] = useState(0);
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async (finalScore: number) => {
        if (!user || !firestore || finalScore <= 0 || hasSubmittedScore) return;
        try {
            const scoresCollection = collection(firestore, 'games', 'sudoku', 'scores');
            await addDocumentNonBlocking(scoresCollection, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userImage: user.photoURL,
                score: finalScore,
                createdAt: serverTimestamp(),
            });
            setHasSubmittedScore(true);
            toast({ title: "You won!", description: `Your score of ${finalScore} has been submitted.` });
        } catch (error) {
            console.error("Error submitting score:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not submit your score." });
        }
    }, [user, firestore, toast, hasSubmittedScore]);

    const createNewPuzzle = useCallback((newLevel: Level) => {
        // The sudoku library's difficulty is not parameterized, it's random.
        // We can simulate difficulty by removing more numbers for harder levels,
        // but for now, we'll just generate a new puzzle.
        const rawPuzzle: (number|null)[] = sudoku.makepuzzle();
        const rawSolution = sudoku.solvepuzzle(rawPuzzle);

        const boardTo2D = (board: (number|null)[]) => {
            const newBoard: number[][] = [];
            for (let i = 0; i < 9; i++) {
                const row = board.slice(i * 9, (i + 1) * 9).map(n => n === null ? 0 : n + 1);
                newBoard.push(row);
            }
            return newBoard;
        }

        const newPuzzle = boardTo2D(rawPuzzle);
        setPuzzle(newPuzzle);
        setPlayerBoard(JSON.parse(JSON.stringify(newPuzzle)));
        setSolution(boardTo2D(rawSolution!));
        
        setIsGameOver(false);
        setIsWinner(false);
        setSelectedCell(null);
        setStartTime(Date.now());
        setTime(0);
        setHasSubmittedScore(false);
    }, []);

    useEffect(() => {
        if (isClient) {
            createNewPuzzle(level);
        }
    }, [level, createNewPuzzle, isClient]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (startTime && !isGameOver) {
            timer = setInterval(() => {
                setTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [startTime, isGameOver]);

    const handleCellClick = (r: number, c: number) => {
        if (puzzle && puzzle[r][c] === 0) {
            setSelectedCell({ r, c });
        }
    };

    const handleNumberInput = (num: number) => {
        if (selectedCell && playerBoard && !isGameOver) {
            const newBoard = playerBoard.map(row => [...row]);
            newBoard[selectedCell.r][selectedCell.c] = num;
            setPlayerBoard(newBoard);

            const isSolved = newBoard.flat().every((cell, index) => cell === solution![Math.floor(index / 9)][index % 9]);

            if(isSolved) {
                setIsWinner(true);
                setIsGameOver(true);
                setStartTime(null);
                const score = Math.max(10, (10000 - time));
                submitScore(score);
            }
        }
    };

    const handleErase = () => {
        if (selectedCell && playerBoard && puzzle && puzzle[selectedCell.r][selectedCell.c] === 0 && !isGameOver) {
            const newBoard = playerBoard.map(row => [...row]);
            newBoard[selectedCell.r][selectedCell.c] = 0;
            setPlayerBoard(newBoard);
        }
    };

    if (!isClient || !playerBoard) {
      return (
        <div className="flex justify-center items-center p-8">
            <RotateCcw className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 md:col-span-2">
                <div className="relative">
                    <div className="grid grid-cols-9 bg-muted-foreground/50 p-1 rounded-md w-full max-w-[450px] aspect-square">
                        {playerBoard.map((row, r) => row.map((cell, c) => {
                            const isPuzzleCell = puzzle![r][c] !== 0;
                            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                            const isSameValue = selectedCell && playerBoard[selectedCell.r][selectedCell.c] !== 0 && playerBoard[selectedCell.r][selectedCell.c] === cell;
                            const isWrong = cell !== 0 && solution && cell !== solution[r][c];

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={cn(
                                        "flex items-center justify-center w-full aspect-square text-base sm:text-2xl font-bold cursor-pointer transition-colors",
                                        "bg-card hover:bg-card-foreground/10",
                                        (c % 3 === 2 && c !== 8) && "border-r-2 border-r-muted-foreground/50",
                                        (r % 3 === 2 && r !== 8) && "border-b-2 border-b-muted-foreground/50",
                                        isSelected && "bg-primary/20",
                                        isSameValue && "bg-primary/10",
                                        isPuzzleCell ? "text-foreground" : "text-primary",
                                        isWrong && !isPuzzleCell && "text-destructive",
                                    )}
                                >
                                    {cell !== 0 ? cell : ''}
                                </div>
                            )
                        }))}
                    </div>
                     {isGameOver && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80">
                            <Award className="w-16 h-16 text-yellow-500" />
                            <h2 className="text-3xl font-bold">You Win!</h2>
                            <p className="text-muted-foreground">Your time: {String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}</p>
                            <Button onClick={() => createNewPuzzle(level)} className="mt-4">Play Again</Button>
                        </div>
                    )}
                </div>
                 <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                        <Button key={num} variant="outline" size="sm" className='w-8 h-8 sm:w-10 sm:h-10' onClick={() => handleNumberInput(num)} disabled={isGameOver}>
                            {num}
                        </Button>
                    ))}
                    <Button variant="destructive" size="sm" className='w-8 h-8 sm:w-10 sm:h-10' onClick={handleErase} disabled={isGameOver}>Erase</Button>
                </div>
            </div>
             <div className="space-y-4 md:col-span-1">
                <div className="p-4 text-center rounded-md bg-muted">
                    <p className="font-mono text-3xl">{String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}</p>
                </div>
                 <Select value={level} onValueChange={(val: Level) => createNewPuzzle(val)} disabled={!isGameOver && startTime !== null}>
                    <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="very-hard">Very Hard</SelectItem>
                    </SelectContent>
                </Select>
                 <Button onClick={() => createNewPuzzle(level)} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                </Button>
                <Leaderboard gameId="sudoku" />
            </div>
        </div>
    );
}
