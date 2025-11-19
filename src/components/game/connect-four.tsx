'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

const ROWS = 6;
const COLS = 7;
const PLAYER = 1;
const AI = 2;

type Board = (0 | 1 | 2)[][];

const createEmptyBoard = (): Board => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWinner = (board: Board): number | null => {
  // Check horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2] && board[r][c] === board[r][c + 3]) {
        return board[r][c];
      }
    }
  }
  // Check vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r + 1][c] && board[r][c] === board[r + 2][c] && board[r][c] === board[r + 3][c]) {
        return board[r][c];
      }
    }
  }
  // Check diagonal (down-right)
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r + 1][c + 1] && board[r][c] === board[r + 2][c + 2] && board[r][c] === board[r + 3][c + 3]) {
        return board[r][c];
      }
    }
  }
  // Check diagonal (up-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r - 1][c + 1] && board[r][c] === board[r - 2][c + 2] && board[r][c] === board[r - 3][c + 3]) {
        return board[r][c];
      }
    }
  }
  return null;
};

export function ConnectFour() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER);
  const [winner, setWinner] = useState<number | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  useEffect(() => {
    if (currentPlayer === AI && !winner) {
      const timeout = setTimeout(() => {
        aiMove();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, winner]);

  const dropPiece = (col: number, player: number): boolean => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        const newBoard = board.map(row => [...row]) as Board;
        newBoard[r][col] = player as 1 | 2;
        setBoard(newBoard);
        const newWinner = checkWinner(newBoard);
        if (newWinner) {
          setWinner(newWinner);
        } else if (newBoard.flat().every(cell => cell !== 0)) {
            setIsDraw(true);
        } else {
            setCurrentPlayer(player === PLAYER ? AI : PLAYER);
        }
        return true;
      }
    }
    return false;
  };
  
  const aiMove = () => {
    const availableCols = Array.from({length: COLS}, (_, i) => i).filter(c => board[0][c] === 0);
    if(availableCols.length === 0) return;
    
    // Simple AI: find a random valid column
    const col = availableCols[Math.floor(Math.random() * availableCols.length)];
    dropPiece(col, AI);
  };
  
  const handleColumnClick = (col: number) => {
    if (winner || currentPlayer !== PLAYER) return;
    dropPiece(col, PLAYER);
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER);
    setWinner(null);
    setIsDraw(false);
  };
  
  const getStatusMessage = () => {
      if (winner) return `Winner: ${winner === PLAYER ? 'You!' : 'AI'}`;
      if (isDraw) return "It's a Draw!";
      return `Current Turn: ${currentPlayer === PLAYER ? 'Your Turn' : 'AI is thinking...'}`;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold">{getStatusMessage()}</div>
      <div className="p-4 rounded-lg bg-blue-900 grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`}}>
        {board[0].map((_, colIndex) => (
            <div key={colIndex} className="w-12 h-full" onClick={() => handleColumnClick(colIndex)}>
            {Array.from({length: ROWS}).map((_, rowIndex) => (
                <div key={rowIndex} className="w-12 h-12 flex items-center justify-center">
                    <div className={cn("w-10 h-10 rounded-full bg-background", 
                        board[rowIndex][colIndex] === PLAYER && "bg-yellow-400",
                        board[rowIndex][colIndex] === AI && "bg-red-500"
                    )}></div>
                </div>
            ))}
            </div>
        ))}
      </div>
      <Button onClick={handleReset} variant="outline">
        <RotateCcw className="w-4 h-4 mr-2" />
        New Game
      </Button>
    </div>
  );
}
