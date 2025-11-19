'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Circle, RotateCcw } from 'lucide-react';

type Player = 'X' | 'O';
type Square = Player | null;

const calculateWinner = (squares: Square[]): Player | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],           // diagonals
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const isBoardFull = (squares: Square[]) => squares.every(square => square !== null);

const SquareComponent = ({ value, onClick }: { value: Square; onClick: () => void }) => {
  return (
    <button
      className="flex items-center justify-center w-20 h-20 text-4xl font-bold border-2 rounded-md sm:w-24 sm:h-24 bg-muted/50 border-primary/20"
      onClick={onClick}
    >
      {value === 'X' && <X className="w-12 h-12 text-blue-500" />}
      {value === 'O' && <Circle className="w-12 h-12 text-red-500" />}
    </button>
  );
};

export function TicTacToeGame() {
  const [board, setBoard] = useState<Square[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  
  const winner = calculateWinner(board);
  const isDraw = !winner && isBoardFull(board);

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const newBoard = board.slice();
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  // Computer's move
  useEffect(() => {
    if (!isXNext && !winner && !isDraw) {
      const emptySquares = board
        .map((sq, index) => (sq === null ? index : null))
        .filter(val => val !== null) as number[];
      
      const timeoutId = setTimeout(() => {
        // Simple AI: find a winning move, block a winning move, or take a random spot
        let move: number | null = null;
        
        // 1. Check if 'O' can win
        for (const i of emptySquares) {
            const tempBoard = [...board];
            tempBoard[i] = 'O';
            if (calculateWinner(tempBoard) === 'O') {
                move = i;
                break;
            }
        }
        
        // 2. Check if 'X' can win and block
        if (move === null) {
            for (const i of emptySquares) {
                const tempBoard = [...board];
                tempBoard[i] = 'X';
                if (calculateWinner(tempBoard) === 'X') {
                    move = i;
                    break;
                }
            }
        }
        
        // 3. Take a random available spot
        if (move === null) {
            const randomIndex = Math.floor(Math.random() * emptySquares.length);
            move = emptySquares[randomIndex];
        }

        const newBoard = board.slice();
        newBoard[move] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
      }, 500); // Add a small delay for AI 'thinking' time
      
      return () => clearTimeout(timeoutId);
    }
  }, [isXNext, board, winner, isDraw]);

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  let status;
  if (winner) {
    status = `Winner: ${winner === 'X' ? 'Player' : 'Computer'}`;
  } else if (isDraw) {
    status = "It's a Draw!";
  } else {
    status = `Next player: ${isXNext ? 'You (X)' : 'Computer (O)'}`;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn("text-lg font-semibold", winner && 'text-primary', isDraw && 'text-amber-500')}>
        {status}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {board.map((_, i) => (
          <SquareComponent key={i} value={board[i]} onClick={() => handleClick(i)} />
        ))}
      </div>
      {(winner || isDraw) && (
        <Button onClick={restartGame} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2"/>
          Play Again
        </Button>
      )}
    </div>
  );
}
