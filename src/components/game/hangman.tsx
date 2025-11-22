'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const wordsByLength = {
    short: ["API", "CSS", "HTML", "NODE"],
    medium: ["REACT", "CLOUD", "GENKIT", "SERVER"],
    long: ["NEXTJS", "TAILWIND", "FIREBASE", "DATABASE"],
    veryLong: ["DEVELOPER", "JAVASCRIPT", "TYPESCRIPT", "COMPONENT", "PROTOTYPE"],
};

type Level = 'rookie' | 'amateur' | 'pro' | 'legend';

const difficultySettings: Record<Level, { mistakes: number, wordLengths: (keyof typeof wordsByLength)[] }> = {
    rookie: { mistakes: 8, wordLengths: ['short'] },
    amateur: { mistakes: 7, wordLengths: ['short', 'medium'] },
    pro: { mistakes: 6, wordLengths: ['medium', 'long'] },
    legend: { mistakes: 5, wordLengths: ['long', 'veryLong'] },
};


const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

export function HangmanGame() {
  const [level, setLevel] = useState<Level>('rookie');
  const [word, setWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const getRandomWord = useCallback((currentLevel: Level) => {
    const availableLengths = difficultySettings[currentLevel].wordLengths;
    const randomLengthKey = availableLengths[Math.floor(Math.random() * availableLengths.length)];
    const words = wordsByLength[randomLengthKey];
    return words[Math.floor(Math.random() * words.length)];
  }, []);

  useEffect(() => {
    setIsClient(true);
    setWord(getRandomWord(level));
  }, []);
  
  const maxMistakes = difficultySettings[level].mistakes;
  const isWinner = isClient && word && word.split('').every(letter => guessedLetters.includes(letter));
  const isLoser = mistakes >= maxMistakes;
  const isGameOver = isWinner || isLoser;

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || !firestore || finalScore <= 0 || hasSubmittedScore) return;
    try {
        const scoresCollection = collection(firestore, 'games', 'hangman', 'scores');
        await addDocumentNonBlocking(scoresCollection, {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userImage: user.photoURL,
            score: finalScore,
            createdAt: serverTimestamp(),
        });
        setHasSubmittedScore(true);
        toast({
            title: isWinner ? "You won!" : "Game Over!",
            description: `Your score of ${finalScore} has been submitted.`,
        });
    } catch (error) {
        console.error("Error submitting score:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not submit your score.",
        });
    }
  }, [user, firestore, toast, hasSubmittedScore, isWinner]);

  useEffect(() => {
    if (isGameOver && !hasSubmittedScore && word) {
        let finalScore = 0;
        if (isWinner) {
            const levelMultiplier = Object.keys(difficultySettings).indexOf(level) + 1;
            finalScore = (word.length * 10) - (mistakes * 5) + (50 * levelMultiplier);
        }
        const calculatedScore = finalScore > 0 ? finalScore : 0;
        setScore(calculatedScore);
        if (calculatedScore > 0) {
            submitScore(calculatedScore);
        }
    }
  }, [isGameOver, hasSubmittedScore, submitScore, isWinner, word, mistakes, level]);


  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || isGameOver) return;
    setGuessedLetters([...guessedLetters, letter]);
    if (!word.includes(letter)) {
      setMistakes(mistakes + 1);
    } else {
        setScore(s => s + 5);
    }
  };

  const restartGame = (newLevel: Level) => {
    setLevel(newLevel);
    setWord(getRandomWord(newLevel));
    setGuessedLetters([]);
    setMistakes(0);
    setScore(0);
    setHasSubmittedScore(false);
  };
  
  const HangmanDrawing = () => {
    const HEAD = (
      <div key="head" className="absolute w-10 h-10 border-4 rounded-full sm:w-12 sm:h-12 border-foreground top-[50px] right-[-14px] sm:right-[-18px]" />
    );
    const BODY = (
      <div key="body" className="absolute w-1 h-20 sm:h-24 bg-foreground top-[90px] sm:top-[98px] right-0" />
    );
    const RIGHT_ARM = (
      <div key="right_arm" className="absolute w-12 h-1 origin-bottom-left transform -rotate-45 sm:w-16 bg-foreground top-[110px] sm:top-[120px] right-[-48px] sm:right-[-64px]" />
    );
    const LEFT_ARM = (
      <div key="left_arm" className="absolute w-12 h-1 origin-bottom-right transform rotate-45 sm:w-16 bg-foreground top-[110px] sm:top-[120px] right-[1px]" />
    );
    const RIGHT_LEG = (
      <div key="right_leg" className="absolute w-12 h-1 origin-bottom-left transform rotate-60 sm:w-16 bg-foreground top-[194px] sm:top-[210px] right-[-44px] sm:right-[-60px]" />
    );
    const LEFT_LEG = (
      <div key="left_leg" className="absolute w-12 h-1 origin-bottom-right transform -rotate-60 sm:w-16 bg-foreground top-[194px] sm:top-[210px] right-[1px]" />
    );
    const EXTRA_PART_1 = ( <div key="extra1" className="absolute w-1 h-10 transform rotate-45 bg-foreground top-10 right-10" /> );
    const EXTRA_PART_2 = ( <div key="extra2" className="absolute w-1 h-10 transform -rotate-45 bg-foreground top-10 right-10" /> );
    const BODY_PARTS = [HEAD, BODY, RIGHT_ARM, LEFT_ARM, RIGHT_LEG, LEFT_LEG, EXTRA_PART_1, EXTRA_PART_2].reverse();
    return (
      <div className="relative h-[280px] w-full max-w-[200px] sm:max-w-none">
        {BODY_PARTS.slice(0, mistakes)}
        <div className="absolute top-0 right-0 w-1 h-12 bg-foreground" />
        <div className="h-1 ml-24 w-36 bg-foreground" />
        <div className="w-1 h-64 ml-24 bg-foreground" />
        <div className="w-48 h-1 bg-foreground" />
      </div>
    );
  };

  if (!isClient) {
      return null;
  }

  return (
    <div className="flex flex-col gap-8 md:grid md:grid-cols-5">
        <div className="flex flex-col items-center col-span-1 md:col-span-3 gap-6">
            <div className="flex flex-col items-center w-full gap-4">
                <HangmanDrawing />
                 <div className="flex flex-wrap justify-center gap-1 text-xl font-bold tracking-wider uppercase sm:gap-2 sm:text-2xl sm:tracking-widest">
                    {word.split('').map((letter, index) => (
                    <span key={index} className="w-6 pb-2 text-center border-b-4 sm:w-10">
                        <span className={cn(guessedLetters.includes(letter) || isLoser ? 'visible' : 'invisible', isLoser && !guessedLetters.includes(letter) && 'text-destructive')}>
                            {letter}
                        </span>
                    </span>
                    ))}
                </div>
            </div>

             <div className="flex flex-wrap justify-center max-w-md gap-1 sm:gap-2">
                {ALPHABET.map(letter => (
                <Button
                    key={letter}
                    variant="outline"
                    size="sm"
                    className="w-7 h-7 text-xs sm:w-10 sm:h-10 sm:text-lg"
                    disabled={guessedLetters.includes(letter) || isGameOver}
                    onClick={() => handleGuess(letter)}
                >
                    {letter}
                </Button>
                ))}
            </div>
            
            {isGameOver && (
                <div className="flex flex-col items-center gap-2 p-4 text-center rounded-md bg-muted">
                    <h3 className="text-xl font-bold">{isWinner ? "You Win!" : "You Lose!"}</h3>
                    {!isWinner && <p className="text-sm">The word was: <span className="font-bold">{word}</span></p>}
                    <p className="text-sm">Final Score: {score}</p>
                    <Button onClick={() => restartGame(level)} size="sm"><RotateCcw className="w-4 h-4 mr-2"/>Play Again</Button>
                </div>
            )}
        </div>
        <div className="space-y-4 md:col-span-2">
            <div className="p-4 rounded-md bg-muted">
                <h3 className="mb-2 text-lg font-semibold text-center">Your Score</h3>
                 <div className="text-3xl font-bold text-center text-primary">{score}</div>
            </div>
            <div className="p-4 rounded-md bg-muted">
                 <Select value={level} onValueChange={(val: Level) => restartGame(val)} disabled={!isGameOver && mistakes > 0}>
                    <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="rookie">Rookie</SelectItem>
                        <SelectItem value="amateur">Amateur</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="legend">Legend</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="p-4 rounded-md bg-muted">
                <h3 className="mb-2 text-lg font-semibold text-center">Mistakes</h3>
                <div className="flex justify-center gap-2">
                    {[...Array(maxMistakes)].map((_, i) => (
                        <div key={i} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${i < mistakes ? 'bg-destructive' : 'bg-muted-foreground/30'}`} />
                    ))}
                </div>
                 <div className="mt-1 text-sm text-center text-muted-foreground">{mistakes} / {maxMistakes}</div>
            </div>
            <Leaderboard gameId="hangman" />
        </div>
    </div>
  );
}
