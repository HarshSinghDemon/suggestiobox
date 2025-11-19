'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RotateCcw, Award, Star, Heart, Cloud, Anchor, Bug, Sun, Moon } from 'lucide-react';

const icons = [Star, Heart, Cloud, Anchor, Bug, Sun, Moon, Award];
const cardValues = [...icons, ...icons];

const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export function MemoryMatch() {
  const [cards, setCards] = useState(() => shuffleArray([...cardValues]));
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<any[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = flippedIndices;
      if (cards[firstIndex] === cards[secondIndex]) {
        setMatchedPairs((prev) => [...prev, cards[firstIndex]]);
      }
      setTimeout(() => {
        setFlippedIndices([]);
        setIsChecking(false);
      }, 1000);
      setMoves((prev) => prev + 1);
    }
  }, [flippedIndices, cards]);

  const handleCardClick = (index: number) => {
    if (isChecking || flippedIndices.includes(index) || matchedPairs.includes(cards[index])) {
      return;
    }
    setFlippedIndices((prev) => [...prev, index]);
  };

  const handleReset = () => {
    setCards(shuffleArray([...cardValues]));
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
  };

  const isGameWon = matchedPairs.length === icons.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-xl font-semibold">Moves: {moves}</div>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {cards.map((Icon, index) => {
              const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(Icon);
              return (
                <div
                  key={index}
                  className={cn(
                    'w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-300',
                    'bg-secondary',
                    isFlipped && 'bg-primary/20 rotate-y-180'
                  )}
                  onClick={() => handleCardClick(index)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className={cn(
                    'transition-opacity duration-300',
                    isFlipped ? 'opacity-100' : 'opacity-0'
                  )}>
                    {isFlipped && <Icon className="w-10 h-10 text-primary-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {isGameWon && (
        <div className="text-2xl font-bold text-green-500">You won in {moves} moves!</div>
      )}
      <Button onClick={handleReset} variant="outline">
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Game
      </Button>
    </div>
  );
}
