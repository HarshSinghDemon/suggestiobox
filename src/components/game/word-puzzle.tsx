'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const WORDS = ["REACT", "NEXTS", "SHADC", "STYLE", "CLOUD", "DEBUG"];
const WORD_LENGTH = 5;
const MAX_TRIES = 6;

const getTodaysWord = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return WORDS[dayOfYear % WORDS.length];
};

export function WordPuzzleGame() {
  const [solution, setSolution] = useState(getTodaysWord());
  const [guesses, setGuesses] = useState<string[]>(Array(MAX_TRIES).fill(''));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      if (e.key === 'Enter') {
        if (currentGuess.length === WORD_LENGTH) {
          handleSubmitGuess();
        }
        return;
      }
      
      if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
        return;
      }
      
      if (e.key.match(/^[a-zA-Z]$/) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess(prev => (prev + e.key).toUpperCase());
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, isGameOver]);

  const handleSubmitGuess = () => {
    if(currentGuess.length !== WORD_LENGTH){
        toast({ title: "Not enough letters", variant: "destructive"});
        return;
    }

    const newGuesses = [...guesses];
    newGuesses[currentGuessIndex] = currentGuess;
    setGuesses(newGuesses);
    
    if (currentGuess === solution) {
      setIsWinner(true);
      setIsGameOver(true);
      toast({ title: "You won!", description: "Congratulations!" });
    } else if (currentGuessIndex === MAX_TRIES - 1) {
      setIsGameOver(true);
      toast({ title: "Game Over", description: `The word was ${solution}`, variant: "destructive" });
    }
    
    setCurrentGuessIndex(prev => prev + 1);
    setCurrentGuess('');
  };

  const restartGame = () => {
    setSolution(getTodaysWord());
    setGuesses(Array(MAX_TRIES).fill(''));
    setCurrentGuessIndex(0);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWinner(false);
  };
  
  const Key = ({ value, onClick }: { value: string; onClick: (val: string) => void }) => {
    const statusClasses: {[key: string]: string} = {};
    guesses.slice(0, currentGuessIndex).forEach(guess => {
        guess.split('').forEach((char, i) => {
            if(char === value) {
                if(solution[i] === char) statusClasses['bg-green-500 text-white'] = 'correct';
                else if (solution.includes(char)) statusClasses['bg-yellow-500 text-white'] = 'present';
                else statusClasses['bg-muted/50'] = 'absent';
            }
        });
    });

    return (
        <button onClick={() => onClick(value)} className={cn("h-12 flex-1 rounded-md text-sm font-bold uppercase flex items-center justify-center", Object.keys(statusClasses).length > 0 ? Object.keys(statusClasses)[0] : "bg-muted")}>
            {value}
        </button>
    )
  }

  const Keyboard = () => {
      const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
      const handleKeyClick = (key: string) => {
          if(isGameOver) return;
          if (key === 'ENTER') {
              if (currentGuess.length === WORD_LENGTH) handleSubmitGuess();
          } else if (key === 'BACKSPACE') {
              setCurrentGuess(prev => prev.slice(0, -1));
          } else if (currentGuess.length < WORD_LENGTH) {
              setCurrentGuess(prev => (prev + key).toUpperCase());
          }
      }

      return (
          <div className="space-y-1">
              {rows.map((row, i) => (
                  <div key={i} className="flex gap-1 justify-center">
                      {row.split('').map(key => <Key key={key} value={key} onClick={handleKeyClick} />)}
                  </div>
              ))}
              <div className="flex gap-1 justify-center">
                  <button onClick={() => handleKeyClick('ENTER')} className="h-12 px-4 rounded-md text-sm font-bold uppercase bg-muted">Enter</button>
                  {"ZXCVBNM".split('').map(key => <Key key={key} value={key} onClick={handleKeyClick} />)}
                  <button onClick={() => handleKeyClick('BACKSPACE')} className="h-12 px-4 rounded-md text-sm font-bold uppercase bg-muted">⌫</button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-rows-6 gap-1">
        {guesses.map((guess, i) => (
          <div key={i} className="grid grid-cols-5 gap-1">
            {Array.from({ length: WORD_LENGTH }).map((_, j) => {
              const char = i === currentGuessIndex ? currentGuess[j] : guess[j];
              const isSubmitted = i < currentGuessIndex;
              let bgClass = "bg-transparent";
              if (isSubmitted) {
                if (guess[j] === solution[j]) bgClass = 'bg-green-500 text-white';
                else if (solution.includes(guess[j])) bgClass = 'bg-yellow-500 text-white';
                else bgClass = 'bg-muted/50';
              }
              return (
                <div
                  key={j}
                  className={cn(
                    'w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase',
                    bgClass,
                    char ? 'border-muted-foreground/50' : 'border-muted'
                  )}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {isGameOver && (
          <div className="flex flex-col items-center gap-2 p-4">
              <h3 className="text-xl font-bold">{isWinner ? "You Won!" : "Game Over"}</h3>
              {!isWinner && <p>The word was: <span className="font-bold tracking-widest">{solution}</span></p>}
              <Button onClick={restartGame}>Play Again Tomorrow</Button>
          </div>
      )}

      <div className="w-full pt-4">
        <Keyboard />
      </div>
    </div>
  );
}
