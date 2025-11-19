'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Scissors, Gem, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

const choices: Choice[] = ['rock', 'paper', 'scissors'];

const choiceIcons: Record<Choice, JSX.Element> = {
  rock: <Gem className="w-6 h-6 sm:w-8 sm:h-8" />,
  paper: <Hand className="w-6 h-6 sm:w-8 sm:h-8" />,
  scissors: <Scissors className="w-6 h-6 sm:w-8 sm:h-8" />,
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
  const [isGameOver, setIsGameOver] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || !firestore || finalScore === 0) return;
    try {
        const scoresCollection = collection(firestore, 'games', 'rock-paper-scissors', 'scores');
        await addDocumentNonBlocking(scoresCollection, {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userImage: user.photoURL,
            score: finalScore,
            createdAt: serverTimestamp(),
        });
        toast({
            title: "Game Over!",
            description: `Your final score of ${finalScore} has been submitted.`,
        });
    } catch (error) {
        console.error("Error submitting score:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not submit your score.",
        });
    }
}, [user, firestore, toast]);

  const handlePlayerChoice = (choice: Choice) => {
    if (isGameOver || result) return;

    const computerChoice = choices[Math.floor(Math.random() * choices.length)];
    setPlayerChoice(choice);
    setComputerChoice(computerChoice);

    if (choice === computerChoice) {
      setResult('draw');
    } else if (rules[choice] === computerChoice) {
      setResult('win');
      const newScore = scores.player + 1;
      setScores(s => ({ ...s, player: newScore }));
      if (newScore >= 5) { // Win condition
          setIsGameOver(true);
          submitScore(newScore);
      }
    } else {
      setResult('lose');
      setScores(s => ({ ...s, computer: s.computer + 1 }));
    }
  };

  const nextRound = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    if(isGameOver) {
        setScores({ player: 0, computer: 0 });
        setIsGameOver(false);
    }
  };

  const getResultColor = (res: Result | null) => {
    if (res === 'win') return 'text-green-500';
    if (res === 'lose') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex flex-col items-center order-2 col-span-1 md:order-1 md:col-span-2 gap-8">

            <div className="flex items-center justify-around w-full gap-4 min-h-[80px]">
                <div className="flex flex-col items-center gap-2">
                    <span className='font-medium'>You</span>
                    <div className={cn("w-20 h-20 p-4 border-2 rounded-full flex items-center justify-center", result === 'win' && 'border-green-500 shadow-lg shadow-green-500/20', result === 'lose' && 'border-destructive')}>
                        {playerChoice ? choiceIcons[playerChoice] : '?'}
                    </div>
                </div>
                <div className="text-2xl font-bold">vs</div>
                <div className="flex flex-col items-center gap-2">
                    <span className='font-medium'>CPU</span>
                    <div className={cn("w-20 h-20 p-4 border-2 rounded-full flex items-center justify-center", result === 'lose' && 'border-green-500', result === 'win' && 'border-destructive')}>
                        {computerChoice ? choiceIcons[computerChoice] : '?'}
                    </div>
                </div>
            </div>

            {result && !isGameOver && (
                <div className="text-center">
                <h2 className={cn("text-2xl font-bold uppercase", getResultColor(result))}>
                    {result}
                </h2>
                <Button variant="outline" size="sm" onClick={nextRound} className="mt-2">
                    Next Round
                </Button>
                </div>
            )}
            
            {isGameOver && (
                <div className="text-center">
                    <h2 className="text-3xl font-bold uppercase text-primary">You Won The Match!</h2>
                    <p className='text-sm text-muted-foreground'>First to 5 points wins. Your score has been submitted.</p>
                    <Button variant="default" size="sm" onClick={nextRound} className="mt-2">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Play Again
                    </Button>
                </div>
            )}

            {!result && !isGameOver && (
                <div className="flex flex-col sm:flex-row gap-4">
                {choices.map(choice => (
                    <Button
                    key={choice}
                    variant="outline"
                    size="lg"
                    onClick={() => handlePlayerChoice(choice)}
                    className="flex flex-col w-28 h-28 sm:w-24 sm:h-24 gap-2"
                    >
                    {choiceIcons[choice]}
                    <span className="capitalize">{choice}</span>
                    </Button>
                ))}
                </div>
            )}
            <p className="text-sm text-center text-muted-foreground">First to 5 points wins!</p>
        </div>
        <div className="order-1 col-span-1 space-y-4 md:order-2">
            <div className="p-4 rounded-md bg-muted">
                <h3 className="mb-2 text-lg font-semibold text-center">Scoreboard</h3>
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
            </div>
            <Leaderboard gameId="rock-paper-scissors" />
        </div>
    </div>
  );
}
