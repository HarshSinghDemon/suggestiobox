'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Circle, RotateCcw } from 'lucide-react';

type Player = 'X' | 'O';
type Square = Player | null;

const calculateWinner = (squares: Square[]): {winner: Player | null, line: number[] | null} => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],           // diagonals
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: line };
    }
  }
  return { winner: null, line: null };
};

const isBoardFull = (squares: Square[]) => squares.every(square => square !== null);

const SquareComponent = ({ value, onClick, isWinning }: { value: Square; onClick: () => void, isWinning: boolean }) => {
  return (
    <button
      className={cn(
        "flex items-center justify-center w-20 h-20 text-4xl font-bold border-2 rounded-md sm:w-24 sm:h-24 bg-muted/50 transition-colors duration-300",
        isWinning ? "bg-primary/20 border-primary" : "border-border"
        )}
      onClick={onClick}
    >
      {value === 'X' && <X className={cn("w-12 h-12", isWinning ? "text-primary-foreground" : "text-blue-500")} />}
      {value === 'O' && <Circle className={cn("w-12 h-12", isWinning ? "text-primary-foreground" : "text-red-500")} />}
    </button>
  );
};

export function TicTacToeGame() {
  const [board, setBoard] = useState<Square[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  
  const { winner, line: winningLine } = calculateWinner(board);
  const isDraw = !winner && isBoardFull(board);

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const newBoard = board.slice();
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  useEffect(() => {
    if (!isXNext && !winner && !isDraw) {
      const emptySquares = board
        .map((sq, index) => (sq === null ? index : null))
        .filter(val => val !== null) as number[];
      
      const timeoutId = setTimeout(() => {
        let move: number | null = null;
        
        for (const i of emptySquares) {
            const tempBoard = [...board];
            tempBoard[i] = 'O';
            if (calculateWinner(tempBoard).winner === 'O') {
                move = i;
                break;
            }
        }
        
        if (move === null) {
            for (const i of emptySquares) {
                const tempBoard = [...board];
                tempBoard[i] = 'X';
                if (calculateWinner(tempBoard).winner === 'X') {
                    move = i;
                    break;
                }
            }
        }

        if (move === null && board[4] === null) {
            move = 4;
        }
        
        if (move === null) {
            const randomIndex = Math.floor(Math.random() * emptySquares.length);
            move = emptySquares[randomIndex];
        }

        const newBoard = board.slice();
        newBoard[move] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
      }, 300);
      
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
      <div className={cn("text-lg font-semibold h-8", winner && 'text-primary', isDraw && 'text-amber-500')}>
        {status}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {board.map((square, i) => (
          <SquareComponent key={i} value={square} onClick={() => handleClick(i)} isWinning={winningLine?.includes(i) ?? false} />
        ))}
      </div>
      {(winner || isDraw) && (
        <Button onClick={restartGame} variant="outline" className="mt-4">
          <RotateCcw className="w-4 h-4 mr-2"/>
          Play Again
        </Button>
      )}
    </div>
  );
}

    