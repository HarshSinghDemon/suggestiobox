'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Circle, RotateCcw, User, Bot, BrainCircuit } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

type Player = 'X' | 'O';
type Square = Player | null;
type GameMode = 'friend' | 'ai';
type Difficulty = 'rookie' | 'amateur' | 'pro' | 'legend';

const calculateWinner = (squares: Square[]): {winner: Player | null, line: number[] | null} => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
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
      {value === 'X' && <X className={cn("w-10 h-10 sm:w-12 sm:h-12", isWinning ? "text-primary-foreground" : "text-blue-500")} />}
      {value === 'O' && <Circle className={cn("w-10 h-10 sm:w-12 sm:h-12", isWinning ? "text-primary-foreground" : "text-red-500")} />}
    </button>
  );
};

export function TicTacToeGame() {
  const [board, setBoard] = useState<Square[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');

  const { winner, line: winningLine } = calculateWinner(board);
  const isDraw = !winner && isBoardFull(board);

  const minimax = (newBoard: Square[], player: Player): { score: number, index?: number } => {
    const emptySquares = newBoard.map((sq, i) => sq === null ? i : null).filter(i => i !== null) as number[];
    const { winner: currentWinner } = calculateWinner(newBoard);

    if (currentWinner === 'X') return { score: -10 };
    if (currentWinner === 'O') return { score: 10 };
    if (emptySquares.length === 0) return { score: 0 };

    const moves: { index: number, score: number }[] = [];
    for (let i = 0; i < emptySquares.length; i++) {
        const move: { index: number, score: number } = { index: emptySquares[i], score: 0 };
        newBoard[emptySquares[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }
        newBoard[emptySquares[i]] = null;
        moves.push(move);
    }
    
    let bestMove: number | undefined;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove!];
  }


  const aiMove = (currentBoard: Square[]) => {
    const newBoard = currentBoard.slice();
    let move: number | undefined;
    const emptySquares = newBoard.map((sq, i) => sq === null ? i : null).filter(i => i !== null) as number[];
    if (emptySquares.length === 0) return;

    if (difficulty === 'legend' || difficulty === 'pro') {
        move = minimax(newBoard, 'O').index;
    } else if (difficulty === 'amateur') {
        // 50% chance of making a perfect move
        if (Math.random() > 0.5) {
            move = minimax(newBoard, 'O').index;
        } else {
            move = emptySquares[Math.floor(Math.random() * emptySquares.length)];
        }
    } else { // rookie
        move = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }
    
    if (move !== undefined) {
      newBoard[move] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
    }
  };

  useEffect(() => {
    if (gameMode === 'ai' && !isXNext && !winner && !isDraw) {
      const timer = setTimeout(() => aiMove(board), 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, winner, isDraw, gameMode, difficulty]);


  const handleClick = (i: number) => {
    if (winner || board[i] || (gameMode === 'ai' && !isXNext)) return;
    
    const newBoard = board.slice();
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };
  
  const changeMode = () => {
      restartGame();
      setGameMode(null);
  }

  if (!gameMode) {
      return (
          <div className="flex flex-col items-center justify-center gap-4 p-8">
              <h3 className="text-xl font-semibold">Choose Your Opponent</h3>
              <div className="flex gap-4">
                  <Button onClick={() => setGameMode('friend')} size="lg"><User className="mr-2"/>Play with a Friend</Button>
                  <Button onClick={() => setGameMode('ai')} size="lg"><Bot className="mr-2"/>Play with CPU</Button>
              </div>
          </div>
      );
  }

  let status;
  if (winner) {
    status = `Winner: Player ${winner}`;
    if (gameMode === 'ai') {
        status = winner === 'X' ? 'You Win!' : 'CPU Wins!';
    }
  } else if (isDraw) {
    status = "It's a Draw!";
  } else {
    status = `Next player: ${isXNext ? 'X' : 'O'}`;
    if(gameMode === 'ai') {
        status = isXNext ? 'Your Turn (X)' : 'CPU is thinking... (O)';
    }
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
      {gameMode === 'ai' && (
        <div className='w-48 mt-4'>
            <Select value={difficulty} onValueChange={(d: Difficulty) => { setDifficulty(d); restartGame(); }}>
                <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="rookie">Rookie</SelectItem>
                    <SelectItem value="amateur">Amateur</SelectItem>
                    <SelectItem value="pro">Pro (Unbeatable)</SelectItem>
                    <SelectItem value="legend">Legend (Unbeatable)</SelectItem>
                </SelectContent>
            </Select>
        </div>
      )}
       <Button onClick={changeMode} variant="link" size="sm" className="mt-2">
        Change Mode
      </Button>
    </div>
  );
}
