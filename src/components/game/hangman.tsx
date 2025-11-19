'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';

const words = ["DEVELOPER", "JAVASCRIPT", "REACT", "NEXTJS", "TAILWIND", "FIREBASE", "GENKIT", "TYPESCRIPT", "COMPONENT", "PROTOTYPE"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

export function HangmanGame() {
  const [word, setWord] = useState(getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const maxMistakes = 6;

  const isWinner = word.split('').every(letter => guessedLetters.includes(letter));
  const isLoser = mistakes >= maxMistakes;
  const isGameOver = isWinner || isLoser;

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || !firestore || finalScore === 0 || hasSubmittedScore) return;
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
    if (isGameOver && !hasSubmittedScore) {
        const finalScore = isWinner ? (word.length * 10) - (mistakes * 5) + 50 : 0;
        setScore(finalScore > 0 ? finalScore : 0);
        submitScore(finalScore > 0 ? finalScore : 0);
    }
  }, [isGameOver, hasSubmittedScore, submitScore, isWinner, word.length, mistakes]);


  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || isGameOver) return;
    setGuessedLetters([...guessedLetters, letter]);
    if (!word.includes(letter)) {
      setMistakes(mistakes + 1);
    } else {
        // Award points for correct guess
        setScore(s => s + 5);
    }
  };

  const restartGame = () => {
    setWord(getRandomWord());
    setGuessedLetters([]);
    setMistakes(0);
    setScore(0);
    setHasSubmittedScore(false);
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
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex flex-col items-center col-span-1 md:col-span-2 gap-6">
            <div className="flex flex-col items-center gap-4">
                <HangmanDrawing />
                 <div className="flex flex-wrap justify-center gap-2 text-2xl font-bold tracking-widest uppercase">
                    {word.split('').map((letter, index) => (
                    <span key={index} className="w-8 pb-2 text-center border-b-4 sm:w-10">
                        <span className={guessedLetters.includes(letter) || isLoser ? 'visible' : 'invisible'}>
                            {isLoser && !guessedLetters.includes(letter) ? <span className="text-destructive">{letter}</span> : letter}
                        </span>
                    </span>
                    ))}
                </div>
            </div>

             <div className="flex flex-wrap justify-center max-w-md gap-2">
                {ALPHABET.map(letter => (
                <Button
                    key={letter}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 text-sm sm:w-10 sm:h-10 sm:text-lg"
                    disabled={guessedLetters.includes(letter) || isGameOver}
                    onClick={() => handleGuess(letter)}
                >
                    {letter}
                </Button>
                ))}
            </div>
            
            {isGameOver && (
                <div className="flex flex-col items-center gap-2 p-4 rounded-md bg-muted">
                    <h3 className="text-xl font-bold">{isWinner ? "You Win!" : "You Lose!"}</h3>
                    {!isWinner && <p>The word was: {word}</p>}
                    <p>Final Score: {score}</p>
                    <Button onClick={restartGame} size="sm"><RotateCcw className="w-4 h-4 mr-2"/>Play Again</Button>
                </div>
            )}
        </div>
        <div className="space-y-4 md:col-span-1">
            <div className="p-4 rounded-md bg-muted">
                <h3 className="mb-2 text-lg font-semibold text-center">Your Score</h3>
                 <div className="text-3xl font-bold text-center text-primary">{score}</div>
            </div>
            <div className="p-4 rounded-md bg-muted">
                <h3 className="mb-2 text-lg font-semibold text-center">Mistakes</h3>
                <div className="flex justify-center gap-2">
                    {[...Array(maxMistakes)].map((_, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${i < mistakes ? 'bg-destructive' : 'bg-muted-foreground/30'}`} />
                    ))}
                </div>
                 <div className="mt-1 text-sm text-center text-muted-foreground">{mistakes} / {maxMistakes}</div>
            </div>
            <Leaderboard gameId="hangman" />
        </div>
    </div>
  );
}
