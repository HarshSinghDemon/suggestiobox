'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Scissors, Gem, RotateCcw, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'Player 1 Wins' | 'Player 2 Wins' | 'CPU Wins' | 'draw';
type GameMode = 'friend' | 'ai';

const choices: Choice[] = ['rock', 'paper', 'scissors'];

const choiceIcons: Record<Choice, JSX.Element> = {
  rock: <Gem className="w-8 h-8 sm:w-10 sm:h-10" />,
  paper: <Hand className="w-8 h-8 sm:w-10 sm:h-10" />,
  scissors: <Scissors className="w-8 h-8 sm:w-10 sm:h-10" />,
};

const rules: Record<Choice, Choice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export function RockPaperScissorsGame() {
  const [player1Choice, setPlayer1Choice] = useState<Choice | null>(null);
  const [player2Choice, setPlayer2Choice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  
  const { toast } = useToast();

  const determineWinner = (p1: Choice, p2: Choice) => {
    let roundResult: Result;
    if (p1 === p2) {
      roundResult = 'draw';
    } else if (rules[p1] === p2) {
      roundResult = 'Player 1 Wins';
      setScores(s => ({ ...s, player1: s.player1 + 1 }));
    } else {
      roundResult = gameMode === 'ai' ? 'CPU Wins' : 'Player 2 Wins';
      setScores(s => ({ ...s, player2: s.player2 + 1 }));
    }
    setResult(roundResult);
    
    if (scores.player1 + (roundResult === 'Player 1 Wins' ? 1 : 0) >= 5) {
        setIsGameOver(true);
        toast({ title: 'Game Over!', description: 'Player 1 wins the match!' });
    } else if (scores.player2 + (roundResult === (gameMode === 'ai' ? 'CPU Wins' : 'Player 2 Wins') ? 1 : 0) >= 5) {
        setIsGameOver(true);
        toast({ title: 'Game Over!', description: `${gameMode === 'ai' ? 'CPU' : 'Player 2'} wins the match!` });
    }
  };

  const handleChoice = (choice: Choice) => {
    if (result || isGameOver) return;
    
    if (gameMode === 'ai') {
        const cpuChoice = choices[Math.floor(Math.random() * choices.length)];
        setPlayer1Choice(choice);
        setPlayer2Choice(cpuChoice);
        determineWinner(choice, cpuChoice);
    } else { // 2 Player mode
        if (currentPlayer === 1) {
            setPlayer1Choice(choice);
            setCurrentPlayer(2);
            toast({ title: "Player 2's Turn", description: "Player 1 has made a choice. Now it's Player 2's turn." });
        } else {
            setPlayer2Choice(choice);
            if (player1Choice) {
                determineWinner(player1Choice, choice);
            }
        }
    }
  };

  useEffect(() => {
    if (result && !isGameOver) {
      const timer = setTimeout(() => {
        nextRound();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [result, isGameOver]);


  const nextRound = () => {
    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setResult(null);
    setCurrentPlayer(1);
    if(isGameOver) {
        setScores({ player1: 0, player2: 0 });
        setIsGameOver(false);
    }
  };
  
  const restartGame = () => {
    nextRound();
    setGameMode(null);
  };
  
  const getResultColor = (res: Result | null) => {
    if (res === 'Player 1 Wins') return 'text-green-500';
    if (res === 'Player 2 Wins' || res === 'CPU Wins') return 'text-red-500';
    if (res === 'draw') return 'text-amber-500';
    return 'text-muted-foreground';
  };

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

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex justify-around w-full max-w-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <User className="w-5 h-5" /> Player 1
          </div>
          <div className="text-3xl font-bold">{scores.player1}</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-semibold">
            {gameMode === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {gameMode === 'ai' ? 'CPU' : 'Player 2'}
          </div>
          <div className="text-3xl font-bold">{scores.player2}</div>
        </div>
      </div>
      
      <div className="relative flex items-center justify-center w-full min-h-[150px]">
        {result && (
          <div className="flex items-center justify-around w-full gap-4">
            <div className="flex flex-col items-center gap-2">
                {player1Choice && choiceIcons[player1Choice]}
                <span className="font-medium">Player 1</span>
            </div>
             <h2 className={cn("text-2xl font-bold uppercase", getResultColor(result))}>
                {result}
            </h2>
            <div className="flex flex-col items-center gap-2">
                {player2Choice && choiceIcons[player2Choice]}
                <span className="font-medium">{gameMode === 'ai' ? 'CPU' : 'Player 2'}</span>
            </div>
          </div>
        )}

        {!result && (
            <div className='text-center'>
                <p className='text-xl font-semibold'>{gameMode === 'friend' ? `Player ${currentPlayer}'s Turn` : "Your Turn"}</p>
                <p className='text-muted-foreground'>Choose your weapon!</p>
            </div>
        )}
      </div>

      {isGameOver ? (
        <Button onClick={restartGame} size="lg">
          New Game
          <RotateCcw className="w-4 h-4 ml-2" />
        </Button>
      ) : result ? (
        <div className="h-40"></div> // Placeholder to maintain height during auto-reset
      ) : (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
            {choices.map(choice => (
                <Button
                key={choice}
                variant="outline"
                size="lg"
                onClick={() => handleChoice(choice)}
                className="flex flex-col w-32 h-32 gap-2 sm:w-28 sm:h-28"
                >
                {choiceIcons[choice]}
                <span className="capitalize">{choice}</span>
                </Button>
            ))}
            </div>
        </div>
      )}
      <Button onClick={restartGame} variant="link" size="sm">
        Change Mode
      </Button>
    </div>
  );
}
