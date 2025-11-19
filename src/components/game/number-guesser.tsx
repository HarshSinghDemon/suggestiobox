'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw } from 'lucide-react';

const generateRandomNumber = () => Math.floor(Math.random() * 100) + 1;

export function NumberGuesser() {
  const [secretNumber, setSecretNumber] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('Make your guess!');
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSecretNumber(generateRandomNumber());
  }, []);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameOver || !guess) return;

    const numGuess = parseInt(guess, 10);
    if (isNaN(numGuess)) {
        setFeedback('Please enter a valid number.');
        return;
    }

    setAttempts((prev) => prev + 1);

    if (numGuess === secretNumber) {
      setFeedback(`You got it in ${attempts + 1} attempts!`);
      setGameOver(true);
    } else if (numGuess < secretNumber) {
      setFeedback('Too low!');
    } else {
      setFeedback('Too high!');
    }
    setGuess('');
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setSecretNumber(generateRandomNumber());
    setGuess('');
    setFeedback('Make your guess!');
    setAttempts(0);
    setGameOver(false);
    inputRef.current?.focus();
  };
  
  const getFeedbackColor = () => {
    if (gameOver) return 'text-green-500';
    if (feedback.includes('low') || feedback.includes('high')) return 'text-yellow-500';
    return 'text-muted-foreground';
  }

  return (
    <div className="flex flex-col items-center gap-6">
        <div className="text-center">
            <p className="text-xl font-semibold">Attempts: {attempts}</p>
            <p className={`text-lg mt-2 ${getFeedbackColor()}`}>{feedback}</p>
        </div>
      
      <form onSubmit={handleGuess} className="flex w-full max-w-sm gap-2">
        <Input
          ref={inputRef}
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess"
          disabled={gameOver}
          className="text-center"
        />
        <Button type="submit" disabled={gameOver}>
          Guess
        </Button>
      </form>
      
      <Button onClick={handleReset} variant="outline">
        <RotateCcw className="w-4 h-4 mr-2" />
        New Game
      </Button>
    </div>
  );
}
