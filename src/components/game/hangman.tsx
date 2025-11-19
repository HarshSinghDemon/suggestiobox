'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const words = ["DEVELOPER", "JAVASCRIPT", "REACT", "NEXTJS", "TAILWIND", "FIREBASE", "GENKIT", "TYPESCRIPT"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

export function HangmanGame() {
  const [word, setWord] = useState(getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const maxMistakes = 6;

  const isWinner = word.split('').every(letter => guessedLetters.includes(letter));
  const isLoser = mistakes >= maxMistakes;
  const isGameOver = isWinner || isLoser;

  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || isGameOver) return;
    setGuessedLetters([...guessedLetters, letter]);
    if (!word.includes(letter)) {
      setMistakes(mistakes + 1);
    }
  };

  const restartGame = () => {
    setWord(getRandomWord());
    setGuessedLetters([]);
    setMistakes(0);
  };
  
  const HangmanDrawing = () => {
    const HEAD = (
      <div key="head" className="absolute w-12 h-12 border-4 rounded-full border-foreground top-[50px] right-[-18px]" />
    );
    const BODY = (
      <div key="body" className="absolute w-1 h-24 bg-foreground top-[98px] right-0" />
    );
    const RIGHT_ARM = (
      <div key="right_arm" className="absolute w-16 h-1 origin-bottom-left transform -rotate-45 bg-foreground top-[120px] right-[-64px]" />
    );
    const LEFT_ARM = (
      <div key="left_arm" className="absolute w-16 h-1 origin-bottom-right transform rotate-45 bg-foreground top-[120px] right-[1px]" />
    );
    const RIGHT_LEG = (
      <div key="right_leg" className="absolute w-16 h-1 origin-bottom-left transform rotate-60 bg-foreground top-[210px] right-[-60px]" />
    );
    const LEFT_LEG = (
      <div key="left_leg" className="absolute w-16 h-1 origin-bottom-right transform -rotate-60 bg-foreground top-[210px] right-[1px]" />
    );

    const BODY_PARTS = [HEAD, BODY, RIGHT_ARM, LEFT_ARM, RIGHT_LEG, LEFT_LEG];
    return (
      <div className="relative h-[280px] w-[200px]">
        {BODY_PARTS.slice(0, mistakes)}
        <div className="absolute top-0 right-0 w-1 h-12 bg-foreground" />
        <div className="h-1 ml-24 w-36 bg-foreground" />
        <div className="w-1 h-64 ml-24 bg-foreground" />
        <div className="w-48 h-1 bg-foreground" />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <HangmanDrawing />

      <div className="flex gap-2 text-2xl font-bold tracking-widest uppercase">
        {word.split('').map((letter, index) => (
          <span key={index} className="w-8 pb-2 text-center border-b-4">
            <span className={guessedLetters.includes(letter) || isLoser ? 'visible' : 'invisible'}>
                {isLoser && !guessedLetters.includes(letter) ? <span className="text-destructive">{letter}</span> : letter}
            </span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {ALPHABET.map(letter => (
          <Button
            key={letter}
            variant="outline"
            size="icon"
            className="w-10 h-10 text-lg"
            disabled={guessedLetters.includes(letter) || isGameOver}
            onClick={() => handleGuess(letter)}
          >
            {letter}
          </Button>
        ))}
      </div>
      
      {isGameOver && (
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-xl font-bold">{isWinner ? "You Win!" : "You Lose!"}</h3>
            {!isWinner && <p>The word was: {word}</p>}
            <Button onClick={restartGame}>Play Again</Button>
          </div>
      )}
    </div>
  );
}
