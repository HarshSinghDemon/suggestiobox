'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Scissors, Gem, RotateCcw, User, Bot, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'Player 1 Wins' | 'Player 2 Wins' | 'draw';

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
  
  const { toast } = useToast();

  const handleChoice = (choice: Choice) => {
    if (result || isGameOver) return;

    if (currentPlayer === 1) {
      setPlayer1Choice(choice);
      setCurrentPlayer(2);
      toast({ title: "Player 2's Turn", description: "Player 1 has made a choice. Now it's Player 2's turn." });
    } else {
      setPlayer2Choice(choice);
      // Determine winner after P2 chooses
      if (player1Choice) {
        determineWinner(player1Choice, choice);
      }
    }
  };

  const determineWinner = (p1: Choice, p2: Choice) => {
    let roundResult: Result;
    if (p1 === p2) {
      roundResult = 'draw';
    } else if (rules[p1] === p2) {
      roundResult = 'Player 1 Wins';
      setScores(s => ({ ...s, player1: s.player1 + 1 }));
    } else {
      roundResult = 'Player 2 Wins';
      setScores(s => ({ ...s, player2: s.player2 + 1 }));
    }
    setResult(roundResult);
    
    if (scores.player1 + (roundResult === 'Player 1 Wins' ? 1 : 0) >= 5) {
        setIsGameOver(true);
        toast({ title: 'Game Over!', description: 'Player 1 wins the match!' });
    } else if (scores.player2 + (roundResult === 'Player 2 Wins' ? 1 : 0) >= 5) {
        setIsGameOver(true);
        toast({ title: 'Game Over!', description: 'Player 2 wins the match!' });
    }
  };

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
  
  const getResultColor = (res: Result | null) => {
    if (res === 'Player 1 Wins' || res === 'Player 2 Wins') return 'text-green-500';
    if (res === 'draw') return 'text-amber-500';
    return 'text-muted-foreground';
  };

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
            <Users className="w-5 h-5" /> Player 2
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
                <span className="font-medium">Player 2</span>
            </div>
          </div>
        )}

        {!result && (
            <div className='text-center'>
                <p className='text-xl font-semibold'>Player {currentPlayer}'s Turn</p>
                <p className='text-muted-foreground'>Choose your weapon!</p>
            </div>
        )}
      </div>


      {(result || isGameOver) ? (
        <Button onClick={nextRound} size="lg">
          {isGameOver ? 'New Game' : 'Next Round'}
          <RotateCcw className="w-4 h-4 ml-2" />
        </Button>
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
    </div>
  );
}
