'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 20;
const ALIEN_WIDTH = 20;
const ALIEN_HEIGHT = 20;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 10;

export function AlienInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 10 });
  const [bullets, setBullets] = useState<{ x: number, y: number }[]>([]);
  const [aliens, setAliens] = useState<{ x: number, y: number }[][]>([]);
  const [alienDirection, setAlienDirection] = useState<'left' | 'right'>('right');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const resetGame = () => {
    setPlayer({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 10 });
    setBullets([]);
    const initialAliens: { x: number, y: number }[][] = [];
    for (let r = 0; r < 4; r++) {
        initialAliens[r] = [];
        for (let c = 0; c < 8; c++) {
            initialAliens[r][c] = { x: c * (ALIEN_WIDTH + 10) + 30, y: r * (ALIEN_HEIGHT + 10) + 30 };
        }
    }
    setAliens(initialAliens);
    setAlienDirection('right');
    setScore(0);
    setIsGameOver(false);
  };
  
  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      if (isGameOver) {
        cancelAnimationFrame(gameLoopRef.current!);
        return;
      }
      
      // Player movement
      setPlayer(prev => {
        let newX = prev.x;
        if (keysPressed.current['ArrowLeft'] && newX > 0) newX -= 5;
        if (keysPressed.current['ArrowRight'] && newX < GAME_WIDTH - PLAYER_WIDTH) newX += 5;
        return { ...prev, x: newX };
      });

      // Shooting
      if (keysPressed.current[' ']) {
        setBullets(prev => {
            if (prev.length < 3) { // Limit bullets on screen
                return [...prev, { x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2, y: player.y }];
            }
            return prev;
        });
        keysPressed.current[' '] = false; // Prevent holding space
      }
      
      // Move bullets & check collisions
      setBullets(prevBullets => {
          const newBullets = prevBullets.map(b => ({ ...b, y: b.y - 7 })).filter(b => b.y > 0);
          let newAliens = [...aliens];
          let newScore = score;
          
          for (let b of newBullets) {
            for(let r = 0; r < newAliens.length; r++) {
              for (let c = 0; c < newAliens[r].length; c++) {
                const alien = newAliens[r][c];
                if (alien && b.x > alien.x && b.x < alien.x + ALIEN_WIDTH && b.y > alien.y && b.y < alien.y + ALIEN_HEIGHT) {
                   // Collision
                   newAliens[r][c] = null as any;
                   newBullets.splice(newBullets.indexOf(b), 1);
                   newScore += 10;
                }
              }
            }
          }
          setAliens(newAliens.map(row => row.filter(a => a !== null)));
          setScore(newScore);

          return newBullets;
      });

      // Move aliens
      setAliens(prevAliens => {
          let moveDown = false;
          let newDirection = alienDirection;
          const newAliens = prevAliens.map(row => row.map(alien => {
              if (!alien) return null;
              if (alien.x + ALIEN_WIDTH >= GAME_WIDTH) { moveDown = true; newDirection = 'left'; }
              if (alien.x <= 0) { moveDown = true; newDirection = 'right'; }
              if (alien.y + ALIEN_HEIGHT >= player.y) { setIsGameOver(true); }
              return { ...alien };
          }));

          if (moveDown) {
              setAlienDirection(newDirection);
              return newAliens.map(row => row.map(alien => alien ? { ...alien, y: alien.y + ALIEN_HEIGHT } : null));
          } else {
              const moveX = alienDirection === 'right' ? 0.5 : -0.5;
              return newAliens.map(row => row.map(alien => alien ? { ...alien, x: alien.x + moveX } : null));
          }
      });
      
      const allAliensDefeated = aliens.every(row => row.length === 0);
      if (allAliensDefeated && !isGameOver) {
          setIsGameOver(true);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current!);
    };
  }, [player.x, aliens, isGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw player
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fillRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    // Draw bullets
    ctx.fillStyle = 'hsl(var(--primary-foreground))';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));

    // Draw aliens
    ctx.fillStyle = 'hsl(var(--destructive))';
    aliens.forEach(row => row.forEach(alien => alien && ctx.fillRect(alien.x, alien.y, ALIEN_WIDTH, ALIEN_HEIGHT)));

  }, [player, bullets, aliens]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold">Score: {score}</div>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 rounded-md border-border bg-background"
      />
       {isGameOver && (
        <div className="absolute flex flex-col items-center justify-center text-center text-white bg-black/50" style={{width: GAME_WIDTH, height: GAME_HEIGHT}}>
            <h3 className="text-3xl font-bold">{aliens.every(r => r.length === 0) ? 'You Win!' : 'Game Over'}</h3>
            <p className="text-xl">Your score: {score}</p>
            <Button onClick={resetGame} className="mt-4">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
            </Button>
        </div>
      )}
      <Button onClick={resetGame} variant="outline" className={cn(isGameOver && "hidden")}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Game
      </Button>
    </div>
  );
}
