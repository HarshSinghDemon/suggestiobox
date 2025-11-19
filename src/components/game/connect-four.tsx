'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Award } from 'lucide-react';

const ROWS = 6;
const COLS = 7;
const PLAYER = 1;
const AI = 2;

const createEmptyBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

export function ConnectFourGame() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER);
  const [winner, setWinner] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (currentPlayer === AI && !gameOver) {
      const timer = setTimeout(() => {
        aiMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameOver, board]);

  const checkWinner = (b: number[][]) => {
    // Horizontal, Vertical, Diagonal checks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const player = b[r][c];
        if (player === 0) continue;
        // Horizontal
        if (c + 3 < COLS && player === b[r][c+1] && player === b[r][c+2] && player === b[r][c+3]) return player;
        // Vertical
        if (r + 3 < ROWS && player === b[r+1][c] && player === b[r+2][c] && player === b[r+3][c]) return player;
        // Diagonal down-right
        if (r + 3 < ROWS && c + 3 < COLS && player === b[r+1][c+1] && player === b[r+2][c+2] && player === b[r+3][c+3]) return player;
        // Diagonal up-right
        if (r - 3 >= 0 && c + 3 < COLS && player === b[r-1][c+1] && player === b[r-2][c+2] && player === b[r-3][c+3]) return player;
      }
    }
    // Check for draw
    if (b.every(row => row.every(cell => cell !== 0))) return 3; // 3 for draw
    return null;
  };
  
  const dropPiece = (col: number, player: number) => {
    const newBoard = board.map(row => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === 0) {
        newBoard[r][col] = player;
        setBoard(newBoard);
        return newBoard;
      }
    }
    return null; // Column is full
  };

  const handlePlayerMove = (col: number) => {
    if (gameOver || currentPlayer !== PLAYER || board[0][col] !== 0) return;
    
    const newBoard = dropPiece(col, PLAYER);
    if(newBoard){
        const newWinner = checkWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
            setGameOver(true);
        } else {
            setCurrentPlayer(AI);
        }
    }
  };

  const aiMove = () => {
    let availableCols = [];
    for (let c = 0; c < COLS; c++) {
      if (board[0][c] === 0) {
        availableCols.push(c);
      }
    }

    if (availableCols.length === 0) return;

    // Simple AI: choose a random available column
    const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
    const newBoard = dropPiece(randomCol, AI);
    
    if(newBoard) {
        const newWinner = checkWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
            setGameOver(true);
        } else {
            setCurrentPlayer(PLAYER);
        }
    }
  };

  const restartGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER);
    setWinner(null);
    setGameOver(false);
  };

  const renderCell = (cell: number, r: number, c: number) => {
      return (
          <div key={`${r}-${c}`} className="w-full h-full p-1 bg-muted rounded-md cursor-pointer" onClick={() => handlePlayerMove(c)}>
              <div className={cn(
                  "w-full h-full rounded-full transition-colors",
                  cell === PLAYER && "bg-blue-500",
                  cell === AI && "bg-red-500",
                  cell === 0 && "bg-background/50",
              )}></div>
          </div>
      )
  }

  const getStatusMessage = () => {
    if (gameOver) {
        if (winner === PLAYER) return "You won!";
        if (winner === AI) return "AI won!";
        if (winner === 3) return "It's a draw!";
    }
    return currentPlayer === PLAYER ? "Your turn" : "AI's turn...";
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-7 gap-2 p-2 rounded-lg bg-card-foreground/10 aspect-[7/6] w-full max-w-xl">
        {board.map((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
      </div>
      <div className="flex items-center justify-between w-full max-w-xl">
        <div className="flex items-center gap-2 font-semibold">
            {gameOver && <Award className={cn("w-5 h-5", winner === PLAYER ? "text-yellow-500" : "text-red-500")} />}
            {getStatusMessage()}
        </div>
        <Button onClick={restartGame}>Restart Game</Button>
      </div>
    </div>
  );
}
