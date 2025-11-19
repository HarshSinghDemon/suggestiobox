'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Award, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
const boardSize = 24;

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export function MemoryGame() {
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const restartGame = useCallback(() => {
    const gameIcons = shuffleArray([...icons, ...icons]);
    setCards(gameIcons);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsGameOver(false);
    setHasSubmittedScore(false);
  }, []);

  useEffect(() => {
    restartGame();
  }, [restartGame]);

  const submitScore = useCallback(async (finalMoves: number) => {
    if (!user || !firestore || finalMoves === 0 || hasSubmittedScore) return;
    const score = Math.max(10, 1000 - finalMoves * 10);
    try {
      const scoresCollection = collection(firestore, 'games', 'memory-game', 'scores');
      await addDocumentNonBlocking(scoresCollection, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userImage: user.photoURL,
        score: score,
        createdAt: serverTimestamp(),
      });
      setHasSubmittedScore(true);
      toast({
        title: "You won!",
        description: `Your score of ${score} has been submitted.`,
      });
    } catch (error) {
      console.error("Error submitting score:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit your score.",
      });
    }
  }, [user, firestore, toast, hasSubmittedScore]);

  useEffect(() => {
    if (matched.length === boardSize) {
      setIsGameOver(true);
      submitScore(moves);
    }
  }, [matched, moves, submitScore]);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index) || isGameOver) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    setMoves(moves + 1);

    if (newFlipped.length === 2) {
      const [firstIndex, secondIndex] = newFlipped;
      if (cards[firstIndex] === cards[secondIndex]) {
        setMatched([...matched, firstIndex, secondIndex]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 md:grid md:grid-cols-3">
        <div className="relative md:col-span-2">
            <div className="grid grid-cols-6 gap-2 sm:gap-4">
                {cards.map((card, index) => {
                const isFlipped = flipped.includes(index);
                const isMatched = matched.includes(index);
                return (
                    <div
                    key={index}
                    className="w-full aspect-square perspective-[1000px]"
                    onClick={() => handleCardClick(index)}
                    >
                    <div
                        className={cn(
                        "relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
                        (isFlipped || isMatched) && "rotate-y-180"
                        )}
                    >
                        <div className="absolute w-full h-full flex items-center justify-center text-2xl sm:text-4xl rounded-md bg-muted backface-hidden">
                            ?
                        </div>
                        <div className="absolute w-full h-full flex items-center justify-center text-2xl sm:text-4xl rounded-md bg-primary/20 rotate-y-180 backface-hidden">
                            {isMatched ? <CheckCircle className="text-green-500"/> : card}
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            {isGameOver && (
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80">
                    <Award className="w-16 h-16 text-yellow-500" />
                    <h2 className="text-3xl font-bold">You Win!</h2>
                    <p className="text-muted-foreground">You completed it in {moves} moves.</p>
                    <Button onClick={restartGame} className="mt-4">Play Again</Button>
                </div>
            )}
        </div>
      <div className="space-y-4 md:col-span-1">
        <div className="p-4 text-center rounded-md bg-muted">
            <h3 className="font-semibold">Moves</h3>
            <p className="text-3xl font-bold">{moves}</p>
        </div>
         <Button onClick={restartGame} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
        </Button>
        <Leaderboard gameId="memory-game" />
      </div>
    </div>
  );
}
