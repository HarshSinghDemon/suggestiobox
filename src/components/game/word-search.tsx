'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Award } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const themes = {
    "Web Dev": ["HTML", "CSS", "REACT", "NODE", "API", "CLOUD", "DATABASE", "SERVER"],
    "Animals": ["LION", "TIGER", "BEAR", "WOLF", "EAGLE", "SNAKE", "SHARK", "WHALE"],
    "Fruits": ["APPLE", "BANANA", "ORANGE", "GRAPE", "MANGO", "PEAR", "CHERRY", "LEMON"],
};
type Theme = keyof typeof themes;

const gridSize = 12;

const generatePuzzle = (words: string[]): { grid: string[][], solution: Record<string, { start: [number, number], end: [number, number] }> } => {
    const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    const solution: Record<string, { start: [number, number], end: [number, number] }> = {};

    const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];

    for (const word of words) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            attempts++;
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);

            const endR = r + (word.length - 1) * dir[0];
            const endC = c + (word.length - 1) * dir[1];

            if (endR >= 0 && endR < gridSize && endC >= 0 && endC < gridSize) {
                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    const checkR = r + i * dir[0];
                    const checkC = c + i * dir[1];
                    if (grid[checkR][checkC] !== '' && grid[checkR][checkC] !== word[i]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        const placeR = r + i * dir[0];
                        const placeC = c + i * dir[1];
                        grid[placeR][placeC] = word[i];
                    }
                    solution[word] = { start: [r, c], end: [endR, endC] };
                    placed = true;
                }
            }
        }
    }

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
            }
        }
    }

    return { grid, solution };
};

export function WordSearchGame() {
    const [theme, setTheme] = useState<Theme>('Web Dev');
    const [puzzleData, setPuzzleData] = useState(generatePuzzle(themes[theme]));
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [selection, setSelection] = useState<[number, number] | null>(null);
    const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [time, setTime] = useState(0);
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    const isMouseDown = useRef(false);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async (finalScore: number) => {
        if (!user || !firestore || finalScore <= 0 || hasSubmittedScore) return;
        try {
            const scoresCollection = collection(firestore, 'games', 'word-search', 'scores');
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

    const resetGame = useCallback((newTheme: Theme) => {
        setTheme(newTheme);
        setPuzzleData(generatePuzzle(themes[newTheme]));
        setFoundWords([]);
        setSelection(null);
        setCurrentPath([]);
        setIsGameOver(false);
        setTime(0);
        setStartTime(Date.now());
        setHasSubmittedScore(false);
    }, []);

    useEffect(() => {
        resetGame(theme);
    }, [theme, resetGame]);

     useEffect(() => {
        let timer: NodeJS.Timeout;
        if (startTime && !isGameOver) {
            timer = setInterval(() => {
                setTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [startTime, isGameOver]);

    useEffect(() => {
        if (!isGameOver && foundWords.length === themes[theme].length) {
            setIsGameOver(true);
            const score = Math.max(10, (themes[theme].length * 100) - time);
            submitScore(score);
        }
    }, [foundWords, isGameOver, theme, time, submitScore]);

    const handleMouseUp = () => {
        isMouseDown.current = false;
        if (!selection || !currentPath.length) return;

        const start = selection;
        const end = currentPath[currentPath.length - 1];

        const selectedWord = currentPath.map(([r, c]) => puzzleData.grid[r][c]).join('');
        const reversedSelectedWord = selectedWord.split('').reverse().join('');

        for (const word in puzzleData.solution) {
            if (foundWords.includes(word)) continue;
            
            if (word === selectedWord || word === reversedSelectedWord) {
                setFoundWords([...foundWords, word]);
                break;
            }
        }
        setSelection(null);
        setCurrentPath([]);
    };

    const handleMouseDown = (r: number, c: number) => {
        isMouseDown.current = true;
        setSelection([r, c]);
        setCurrentPath([[r, c]]);
    };

    const handleMouseEnter = (r: number, c: number) => {
        if (!isMouseDown.current || !selection) return;

        const [startR, startC] = selection;
        const dr = r - startR;
        const dc = c - startC;
        const newPath: [number, number][] = [];

        if (dr === 0 && dc === 0) {
            newPath.push([r, c]);
        } else if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) { // horizontal, vertical, or diagonal
            const stepR = Math.sign(dr);
            const stepC = Math.sign(dc);
            const len = Math.max(Math.abs(dr), Math.abs(dc));
            for (let i = 0; i <= len; i++) {
                newPath.push([startR + i * stepR, startC + i * stepC]);
            }
        }
        setCurrentPath(newPath);
    };

    const isCellInPath = (r: number, c: number) => currentPath.some(([pr, pc]) => pr === r && pc === c);
    
    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 md:col-span-2">
                <div
                    className="grid p-1 bg-muted-foreground/50 rounded-md select-none"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {puzzleData.grid.map((row, r) => row.map((cell, c) => (
                        <div
                            key={`${r}-${c}`}
                            className={cn(
                                "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base font-bold bg-card transition-colors",
                                isCellInPath(r, c) && "bg-primary/50 text-primary-foreground",
                            )}
                            onMouseDown={() => handleMouseDown(r, c)}
                            onMouseEnter={() => handleMouseEnter(r, c)}
                        >
                            {cell}
                        </div>
                    )))}
                </div>
            </div>
            <div className="space-y-4 md:col-span-1">
                <div className="p-4 rounded-md bg-muted">
                    <p className="text-center font-mono text-2xl">{String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}</p>
                </div>
                <Select value={theme} onValueChange={(val: Theme) => resetGame(val)} disabled={!isGameOver && startTime !== null}>
                    <SelectTrigger><SelectValue placeholder="Theme" /></SelectTrigger>
                    <SelectContent>
                        {Object.keys(themes).map(th => <SelectItem key={th} value={th}>{th}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Button onClick={() => resetGame(theme)} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                </Button>
                <div className="p-4 rounded-md bg-card border">
                    <h3 className="font-semibold text-center">Words to Find</h3>
                    <ul className="grid grid-cols-2 gap-2 mt-2 text-sm text-center">
                        {themes[theme].map(word => (
                            <li key={word} className={cn("transition-colors", foundWords.includes(word) && "line-through text-muted-foreground")}>
                                {word}
                            </li>
                        ))}
                    </ul>
                </div>
                <Leaderboard gameId="word-search" />
            </div>
        </div>
    );
}
