'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bomb, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

type Level = 'easy' | 'medium' | 'hard';
const LEVELS: Record<Level, { size: number, mines: number }> = {
    easy: { size: 9, mines: 10 },
    medium: { size: 16, mines: 40 },
    hard: { size: 20, mines: 80 },
};

type Cell = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
};

const createBoard = (size: number, mines: number): Cell[][] => {
    const board: Cell[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({
            isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0
        }))
    );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            minesPlaced++;
        }
    }

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc].isMine) {
                        count++;
                    }
                }
            }
            board[r][c].adjacentMines = count;
        }
    }
    return board;
};

export function MinesweeperGame() {
    const [level, setLevel] = useState<Level>('easy');
    const [board, setBoard] = useState(createBoard(LEVELS[level].size, LEVELS[level].mines));
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [flagsPlaced, setFlagsPlaced] = useState(0);

    const resetGame = (newLevel: Level) => {
        setLevel(newLevel);
        setBoard(createBoard(LEVELS[newLevel].size, LEVELS[newLevel].mines));
        setIsGameOver(false);
        setIsWinner(false);
        setFlagsPlaced(0);
    };
    
    useEffect(() => {
        const revealedCount = board.flat().filter(cell => cell.isRevealed).length;
        if (!isGameOver && revealedCount > 0 && revealedCount === (LEVELS[level].size * LEVELS[level].size - LEVELS[level].mines)) {
            setIsWinner(true);
            setIsGameOver(true);
        }
    }, [board, level, isGameOver]);


    const revealCell = (r: number, c: number, newBoard: Cell[][]) => {
        if (r < 0 || r >= LEVELS[level].size || c < 0 || c >= LEVELS[level].size || newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) {
            return;
        }

        newBoard[r][c].isRevealed = true;

        if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        revealCell(r + dr, c + dc, newBoard);
                    }
                }
            }
        }
    };
    
    const handleClick = (r: number, c: number) => {
        if (isGameOver || board[r][c].isFlagged || board[r][c].isRevealed) return;

        if (board[r][c].isMine) {
            setIsGameOver(true);
            const newBoard = board.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
            setBoard(newBoard);
            return;
        }

        const newBoard = board.map(row => [...row]);
        revealCell(r, c, newBoard);
        setBoard(newBoard);
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (isGameOver || board[r][c].isRevealed) return;

        const newBoard = [...board];
        const cell = { ...newBoard[r][c] };

        if (cell.isFlagged) {
            cell.isFlagged = false;
            setFlagsPlaced(f => f - 1);
        } else {
            cell.isFlagged = true;
            setFlagsPlaced(f => f + 1);
        }
        
        newBoard[r] = [...newBoard[r]];
        newBoard[r][c] = cell;
        setBoard(newBoard);
    };
    
    const numberColors = [
        "text-blue-500", "text-green-500", "text-red-500", "text-purple-500",
        "text-orange-500", "text-yellow-500", "text-pink-500", "text-indigo-500"
    ];

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full">
                <div className='flex items-center gap-2'>
                    <Bomb className="w-5 h-5"/>
                    <span className="font-mono">{LEVELS[level].mines - flagsPlaced}</span>
                </div>
                 <Select value={level} onValueChange={(val: Level) => resetGame(val)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className={cn("grid gap-0.5 bg-muted-foreground", `grid-cols-${LEVELS[level].size}`)} style={{gridTemplateColumns: `repeat(${LEVELS[level].size}, minmax(0, 1fr))`}}>
                {board.map((row, r) => row.map((cell, c) => (
                    <button
                        key={`${r}-${c}`}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center font-bold text-lg",
                            cell.isRevealed ? 'bg-muted' : 'bg-muted/50 hover:bg-muted/70',
                        )}
                        onClick={() => handleClick(r, c)}
                        onContextMenu={(e) => handleRightClick(e, r, c)}
                        disabled={isGameOver && !cell.isMine}
                    >
                        {cell.isRevealed ? (
                            cell.isMine ? <Bomb className="w-5 h-5 text-destructive" /> : (cell.adjacentMines > 0 && <span className={cn(numberColors[cell.adjacentMines-1])}>{cell.adjacentMines}</span>)
                        ) : cell.isFlagged ? <Flag className="w-5 h-5" /> : ''}
                    </button>
                )))}
            </div>

            {isGameOver && (
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-xl font-bold">{isWinner ? "You Win!" : "Game Over"}</h3>
                    <Button onClick={() => resetGame(level)}>Play Again</Button>
                </div>
            )}
        </div>
    );
}
