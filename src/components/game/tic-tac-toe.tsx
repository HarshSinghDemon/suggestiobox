'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { X, Circle, RotateCcw } from 'lucide-react';

type Player = 'X' | 'O' | null;

const calculateWinner = (squares: Player[]): Player => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const Square = ({ value, onClick }: { value: Player; onClick: () => void }) => (
  <Button
    variant="outline"
    className="flex items-center justify-center w-20 h-20 text-4xl font-bold rounded-lg aspect-square"
    onClick={onClick}
  >
    {value === 'X' && <X className="w-10 h-10 text-red-500" />}
    {value === 'O' && <Circle className="w-10 h-10 text-blue-500" />}
  </Button>
);

export function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = calculateWinner(board);
  const isBoardFull = board.every(Boolean);

  const handleSquareClick = (index: number) => {
    if (winner || board[index]) return;
    const newBoard = board.slice();
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  useEffect(() => {
    if (!isXNext && !winner && !isBoardFull) {
      const timeout = setTimeout(() => {
        let bestMove = -1;
        
        // Simple AI: find winning move or block opponent's winning move
        for(let i = 0; i < 9; i++) {
            if (!board[i]) {
                // Check if AI can win
                const tempBoard = board.slice();
                tempBoard[i] = 'O';
                if(calculateWinner(tempBoard) === 'O') {
                    bestMove = i;
                    break;
                }
                // Check if player can win and block
                tempBoard[i] = 'X';
                if(calculateWinner(tempBoard) === 'X') {
                    bestMove = i;
                }
            }
        }

        if (bestMove === -1) {
            // Otherwise, take a random available spot
            const availableSpots = board
            .map((val, idx) => (val === null ? idx : null))
            .filter((val) => val !== null) as number[];
            bestMove = availableSpots[Math.floor(Math.random() * availableSpots.length)];
        }


        if (bestMove !== -1) {
            const newBoard = board.slice();
            newBoard[bestMove] = 'O';
            setBoard(newBoard);
            setIsXNext(true);
        }

      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [board, isXNext, winner, isBoardFull]);

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const getStatus = () => {
    if (winner) {
      return `Winner: ${winner === 'X' ? 'You' : 'Computer'}`;
    }
    if (isBoardFull) {
      return "It's a draw!";
    }
    return `Next player: ${isXNext ? 'You (X)' : 'Computer (O)'}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {board.map((_, i) => (
              <Square key={i} value={board[i]} onClick={() => handleSquareClick(i)} />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="text-xl font-semibold">{getStatus()}</div>
      <Button onClick={handleReset} variant="outline">
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Game
      </Button>
    </div>
  );
}
