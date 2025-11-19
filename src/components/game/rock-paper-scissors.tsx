'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Scissors, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

const choices: Choice[] = ['rock', 'paper', 'scissors'];

const choiceIcons = {
  rock: <Gem className="w-8 h-8" />,
  paper: <Hand className="w-8 h-8" />,
  scissors: <Scissors className="w-8 h-8" />,
};

const rules: Record<Choice, Choice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export function RockPaperScissorsGame() {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState({ player: 0, computer: 0 });

  const handlePlayerChoice = (choice: Choice) => {
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];
    setPlayerChoice(choice);
    setComputerChoice(computerChoice);

    if (choice === computerChoice) {
      setResult('draw');
    } else if (rules[choice] === computerChoice) {
      setResult('win');
      setScores(s => ({ ...s, player: s.player + 1 }));
    } else {
      setResult('lose');
      setScores(s => ({ ...s, computer: s.computer + 1 }));
    }
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  const getResultColor = (res: Result | null) => {
    if (res === 'win') return 'text-green-500';
    if (res === 'lose') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex justify-around w-full">
        <div className="text-center">
          <div className="text-lg font-semibold">Player</div>
          <div className="text-3xl font-bold">{scores.player}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">Computer</div>
          <div className="text-3xl font-bold">{scores.computer}</div>
        </div>
      </div>

      <div className="flex items-center justify-center w-full gap-8 min-h-[80px]">
        <div className="flex flex-col items-center gap-2">
            <span className='font-medium'>You</span>
            <div className="w-20 h-20 p-4 border-2 rounded-full flex items-center justify-center">
                {playerChoice ? choiceIcons[playerChoice] : '?'}
            </div>
        </div>
        <div className="text-2xl font-bold">vs</div>
        <div className="flex flex-col items-center gap-2">
            <span className='font-medium'>CPU</span>
            <div className="w-20 h-20 p-4 border-2 rounded-full flex items-center justify-center">
                {computerChoice ? choiceIcons[computerChoice] : '?'}
            </div>
        </div>
      </div>

      {result && (
        <div className="text-center">
          <h2 className={cn("text-3xl font-bold uppercase", getResultColor(result))}>
            {result === 'win' ? 'You Win!' : result === 'lose' ? 'You Lose!' : 'It\'s a Draw!'}
          </h2>
          <Button variant="outline" size="sm" onClick={resetGame} className="mt-2">
            Play Again
          </Button>
        </div>
      )}

      {!result && (
        <div className="flex gap-4">
          {choices.map(choice => (
            <Button
              key={choice}
              variant="outline"
              size="lg"
              onClick={() => handlePlayerChoice(choice)}
              className="flex flex-col w-24 h-24 gap-2"
            >
              {choiceIcons[choice]}
              <span className="capitalize">{choice}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
