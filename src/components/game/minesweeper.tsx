'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bomb, Flag, MousePointerClick, RotateCcw } from 'lucide-react';
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

type Mode = 'reveal' | 'flag';

const createBoard = (size: number, mines: number, firstClick: {r: number, c: number}): Cell[][] => {
    const board: Cell[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({
            isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0
        }))
    );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        // Ensure first click is not a mine
        if (!board[row][col].isMine && (row !== firstClick.r || col !== firstClick.c)) {
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
    const [board, setBoard] = useState<Cell[][] | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [flagsPlaced, setFlagsPlaced] = useState(0);
    const [mode, setMode] = useState<Mode>('reveal');
    const [firstClick, setFirstClick] = useState(true);

    const resetGame = (newLevel: Level) => {
        setLevel(newLevel);
        setBoard(null);
        setIsGameOver(false);
        setIsWinner(false);
        setFlagsPlaced(0);
        setFirstClick(true);
    };
    
    useEffect(() => {
        if (!board || isGameOver || firstClick) return;

        const revealedCount = board.flat().filter(cell => cell.isRevealed).length;
        if (revealedCount === (LEVELS[level].size * LEVELS[level].size - LEVELS[level].mines)) {
            setIsWinner(true);
            setIsGameOver(true);
        }
    }, [board, level, isGameOver, firstClick]);


    const revealCell = (r: number, c: number, currentBoard: Cell[][]) => {
        if (r < 0 || r >= LEVELS[level].size || c < 0 || c >= LEVELS[level].size || currentBoard[r][c].isRevealed || currentBoard[r][c].isFlagged) {
            return;
        }

        currentBoard[r][c].isRevealed = true;

        if (currentBoard[r][c].adjacentMines === 0 && !currentBoard[r][c].isMine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        revealCell(r + dr, c + dc, currentBoard);
                    }
                }
            }
        }
    };
    
    const handleClick = (r: number, c: number) => {
        if (isGameOver) return;
        
        if (firstClick) {
            const newBoard = createBoard(LEVELS[level].size, LEVELS[level].mines, {r, c});
            revealCell(r, c, newBoard);
            setBoard(newBoard);
            setFirstClick(false);
            return;
        }

        if(!board) return;

        const newBoard = board.map(row => row.map(cell => ({...cell})));

        if (mode === 'flag' || newBoard[r][c].isRevealed) {
            handleFlag(r, c, newBoard);
        } else {
            if (newBoard[r][c].isFlagged) return;

            if (newBoard[r][c].isMine) {
                setIsGameOver(true);
                const finalBoard = newBoard.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
                setBoard(finalBoard);
                return;
            }
            revealCell(r, c, newBoard);
        }
        setBoard(newBoard);
    };

    const handleFlag = (r: number, c: number, boardToUpdate: Cell[][]) => {
        if (boardToUpdate[r][c].isRevealed) return;
        
        boardToUpdate[r][c].isFlagged = !boardToUpdate[r][c].isFlagged;
        setFlagsPlaced(f => f + (boardToUpdate[r][c].isFlagged ? 1 : -1));
    };

    const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if(firstClick || !board || isGameOver) return;
        const newBoard = board.map(row => row.map(cell => ({...cell})));
        handleFlag(r,c, newBoard);
        setBoard(newBoard);
    }
    
    const numberColors = [
        "text-blue-500", "text-green-500", "text-red-500", "text-purple-500",
        "text-orange-500", "text-yellow-500", "text-pink-500", "text-indigo-500"
    ];
    
    const cellSize = `w-7 h-7 sm:w-8 sm:h-8`;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full items-center">
                <div className='flex items-center gap-2'>
                    <Bomb className="w-5 h-5"/>
                    <span className="font-mono text-lg">{LEVELS[level].mines - flagsPlaced}</span>
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
                 <Button variant="outline" size="sm" onClick={() => resetGame(level)}>
                    <RotateCcw className="w-4 h-4"/>
                 </Button>
            </div>

            <div 
                className={cn("grid gap-0.5 bg-muted-foreground/50 p-1 rounded-md")} 
                style={{gridTemplateColumns: `repeat(${LEVELS[level].size}, minmax(0, 1fr))`}}
            >
                {board ? board.map((row, r) => row.map((cell, c) => (
                    <button
                        key={`${r}-${c}`}
                        className={cn(
                            "flex items-center justify-center font-bold text-lg rounded-sm",
                             cellSize,
                            cell.isRevealed ? 'bg-muted' : 'bg-muted/50 hover:bg-muted/70',
                            isGameOver && cell.isMine && !cell.isFlagged ? 'bg-red-500/50' : '',
                            isGameOver && cell.isFlagged && !cell.isMine ? 'bg-yellow-500/50' : '',
                        )}
                        onClick={() => handleClick(r, c)}
                        onContextMenu={(e) => handleContextMenu(e, r, c)}
                        disabled={isGameOver && !cell.isMine}
                    >
                        {cell.isRevealed ? (
                            cell.isMine ? <Bomb className="w-5 h-5 text-background" /> : (cell.adjacentMines > 0 && <span className={cn(numberColors[cell.adjacentMines-1])}>{cell.adjacentMines}</span>)
                        ) : cell.isFlagged ? <Flag className="w-5 h-5" /> : ''}
                    </button>
                ))) : (
                    <div 
                        className="flex items-center justify-center text-center text-muted-foreground p-8"
                        style={{gridColumn: `span ${LEVELS[level].size}`}}
                    >
                        Click any cell to start
                    </div>
                )}
            </div>

            <div className='flex items-center gap-2 md:hidden'>
                <span className='text-sm'>Mode:</span>
                <Button
                    size="sm"
                    variant={mode === 'reveal' ? 'secondary' : 'ghost'}
                    onClick={() => setMode('reveal')}
                >
                    <MousePointerClick className="w-4 h-4 mr-2" /> Reveal
                </Button>
                <Button
                    size="sm"
                    variant={mode === 'flag' ? 'secondary' : 'ghost'}
                    onClick={() => setMode('flag')}
                >
                    <Flag className="w-4 h-4 mr-2" /> Flag
                </Button>
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
