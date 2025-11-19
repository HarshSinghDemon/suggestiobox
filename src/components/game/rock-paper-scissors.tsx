'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Scissors, Gem } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw' | null;

const choices: { name: Choice; icon: React.ReactNode }[] = [
  { name: 'rock', icon: <Gem className="w-8 h-8" /> },
  { name: 'paper', icon: <Hand className="w-8 h-8" /> },
  { name: 'scissors', icon: <Scissors className="w-8 h-8" /> },
];

export function RockPaperScissors() {
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [scores, setScores] = useState({ user: 0, computer: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const getResult = (user: Choice, computer: Choice) => {
    if (user === computer) return 'draw';
    if (
      (user === 'rock' && computer === 'scissors') ||
      (user === 'scissors' && computer === 'paper') ||
      (user === 'paper' && computer === 'rock')
    ) {
      return 'win';
    }
    return 'lose';
  };

  const handlePlay = (choice: Choice) => {
    setIsPlaying(true);
    setUserChoice(null);
    setComputerChoice(null);
    setResult(null);

    setTimeout(() => {
        const computerChoice = choices[Math.floor(Math.random() * choices.length)].name;
        const gameResult = getResult(choice, computerChoice);
    
        setUserChoice(choice);
        setComputerChoice(computerChoice);
        setResult(gameResult);
    
        if (gameResult === 'win') {
          setScores((prev) => ({ ...prev, user: prev.user + 1 }));
        } else if (gameResult === 'lose') {
          setScores((prev) => ({ ...prev, computer: prev.computer + 1 }));
        }
        setIsPlaying(false);
    }, 1000);
  };

  const resetGame = () => {
    setUserChoice(null);
    setComputerChoice(null);
    setResult(null);
    setScores({ user: 0, computer: 0 });
  };
  
  const getResultStyles = () => {
    if (result === 'win') return 'text-green-500';
    if (result === 'lose') return 'text-red-500';
    return 'text-muted-foreground';
  }

  const getChoiceIcon = (choice: Choice | null) => {
    if (!choice) return null;
    return choices.find(c => c.name === choice)?.icon;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex justify-around w-full max-w-md">
        <div className="text-center">
          <p className="text-lg font-semibold">You</p>
          <p className="text-4xl font-bold text-primary">{scores.user}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">Computer</p>
          <p className="text-4xl font-bold text-secondary">{scores.computer}</p>
        </div>
      </div>

      <Card className="flex items-center justify-center w-full min-h-[150px]">
        <CardContent className="p-4">
          {isPlaying ? (
              <div className="text-xl font-medium animate-pulse">Playing...</div>
          ) : result ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                      <p className="font-medium">You chose:</p>
                      <div className="w-16 h-16">{getChoiceIcon(userChoice)}</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                      <p className="font-medium">CPU chose:</p>
                      <div className="w-16 h-16">{getChoiceIcon(computerChoice)}</div>
                  </div>
              </div>
              <p className={`text-2xl font-bold uppercase ${getResultStyles()}`}>
                {result === 'draw' ? "It's a Draw!" : `You ${result}!`}
              </p>
            </div>
          ) : (
            <p className="text-xl font-medium text-muted-foreground">Make your choice!</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        {choices.map(({ name, icon }) => (
          <Button
            key={name}
            variant="outline"
            size="lg"
            className="w-24 h-24 rounded-full"
            onClick={() => handlePlay(name)}
            disabled={isPlaying}
          >
            {icon}
          </Button>
        ))}
      </div>

      <Button variant="ghost" onClick={resetGame}>Reset Game</Button>
    </div>
  );
}
