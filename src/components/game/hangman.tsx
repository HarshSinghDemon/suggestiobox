'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORDS = ["firebase", "react", "nextjs", "tailwind", "genkit", "firestore", "component", "developer"];
const pickRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase();

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const MAX_ATTEMPTS = 6;

export function Hangman() {
  const [solution, setSolution] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const incorrectGuesses = guessedLetters.filter(letter => !solution.includes(letter));
  const isWinner = solution && solution.split('').every(letter => guessedLetters.includes(letter));

  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    if (incorrectGuesses.length >= MAX_ATTEMPTS || isWinner) {
      setIsGameOver(true);
    }
  }, [incorrectGuesses, isWinner]);

  const handleGuess = (letter: string) => {
    if (isGameOver || guessedLetters.includes(letter)) return;
    setGuessedLetters(prev => [...prev, letter]);
  };

  const resetGame = () => {
    setSolution(pickRandomWord());
    setGuessedLetters([]);
    setAttempts(0);
    setIsGameOver(false);
  };
  
  const HangmanDrawing = () => {
    const head = <div className="absolute w-12 h-12 border-4 rounded-full border-foreground top-[50px] right-[-22px]" />;
    const body = <div className="absolute h-24 w-1 bg-foreground top-[98px] right-0" />;
    const rightArm = <div className="absolute w-20 h-1 rotate-45 bg-foreground top-[120px] right-[-80px]" />;
    const leftArm = <div className="absolute w-20 h-1 -rotate-45 bg-foreground top-[120px] right-[0px]" />;
    const rightLeg = <div className="absolute w-20 h-1 rotate-[135deg] bg-foreground top-[200px] right-[-70px]" />;
    const leftLeg = <div className="absolute w-20 h-1 -rotate-[135deg] bg-foreground top-[200px] right-[10px]" />;

    const bodyParts = [head, body, rightArm, leftArm, rightLeg, leftLeg];

    return (
        <div className="relative h-64 w-40">
            {bodyParts.slice(0, incorrectGuesses.length)}
            <div className="absolute top-0 right-0 h-12 w-1 bg-foreground" />
            <div className="h-1 w-40 bg-foreground" />
            <div className="h-64 w-1 ml-16 bg-foreground" />
            <div className="h-1 w-64 bg-foreground" />
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
        <HangmanDrawing />
        
        <div className="flex gap-2 text-3xl font-mono font-bold tracking-widest">
            {solution.split('').map((letter, index) => (
                <span key={index} className="pb-2 border-b-4 w-9 text-center">
                    <span className={cn(guessedLetters.includes(letter) || isGameOver ? "visible" : "invisible")}>
                        {letter}
                    </span>
                </span>
            ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 self-stretch">
            {ALPHABET.map(letter => (
                <Button 
                    key={letter} 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleGuess(letter)}
                    disabled={guessedLetters.includes(letter) || isGameOver}
                    className={cn(guessedLetters.includes(letter) && !solution.includes(letter) && "bg-destructive text-destructive-foreground opacity-50", 
                                guessedLetters.includes(letter) && solution.includes(letter) && "bg-green-500 text-white opacity-50")}
                >
                    {letter}
                </Button>
            ))}
        </div>
        
        {isGameOver && (
             <div className="flex flex-col items-center gap-2">
                <p className="text-2xl font-bold">{isWinner ? "You Win!" : "Nice Try!"}</p>
                <p>The word was: <span className="font-bold">{solution}</span></p>
                <Button onClick={resetGame}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                </Button>
            </div>
        )}
    </div>
  );
}
