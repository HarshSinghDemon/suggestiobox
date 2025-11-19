'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

const WORDS = ['react', 'cloud', 'style', 'route', 'state'];
const pickRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

export function WordPuzzle() {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState<string[]>(Array(6).fill(''));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setSolution(pickRandomWord());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (e.key >= 'a' && e.key <= 'z') {
        setGuesses((prev) => {
          const newGuesses = [...prev];
          if (newGuesses[currentGuessIndex].length < 5) {
            newGuesses[currentGuessIndex] += e.key;
          }
          return newGuesses;
        });
      } else if (e.key === 'Backspace') {
        setGuesses((prev) => {
          const newGuesses = [...prev];
          newGuesses[currentGuessIndex] = newGuesses[currentGuessIndex].slice(0, -1);
          return newGuesses;
        });
      } else if (e.key === 'Enter') {
        handleGuess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuessIndex, isGameOver, guesses]);

  const handleGuess = () => {
    const currentGuess = guesses[currentGuessIndex];
    if (currentGuess.length !== 5) {
        setFeedback('Guess must be 5 letters long!');
        setTimeout(() => setFeedback(''), 2000);
        return;
    }

    if (currentGuess === solution) {
      setIsGameOver(true);
      setFeedback(`You won! The word was ${solution.toUpperCase()}.`);
    } else if (currentGuessIndex === 5) {
      setIsGameOver(true);
      setFeedback(`Game over! The word was ${solution.toUpperCase()}.`);
    } else {
      setCurrentGuessIndex(currentGuessIndex + 1);
    }
  };
  
  const handleReset = () => {
    setSolution(pickRandomWord());
    setGuesses(Array(6).fill(''));
    setCurrentGuessIndex(0);
    setIsGameOver(false);
    setFeedback('');
  };

  const getTileClass = (char: string, index: number, guess: string) => {
    if (!guess) return 'border-border';
    if (solution[index] === char) return 'bg-green-500 text-white border-green-500';
    if (solution.includes(char)) return 'bg-yellow-500 text-white border-yellow-500';
    return 'bg-muted/50 border-muted';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-rows-6 gap-2">
        {guesses.map((guess, i) => (
          <div key={i} className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, j) => {
              const char = guess[j] || '';
              const isSubmitted = i < currentGuessIndex;
              return (
                <div
                  key={j}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-md border-2 text-2xl font-bold uppercase',
                    isSubmitted ? getTileClass(char, j, guess) : 'border-border'
                  )}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {feedback && <p className="text-lg font-semibold">{feedback}</p>}
      <Button onClick={handleReset}>
        <RotateCcw className="w-4 h-4 mr-2" />
        New Game
      </Button>
    </div>
  );
}
