'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const GAME_WIDTH = 500;
const GAME_HEIGHT = 400;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 8;
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;

type Brick = { x: number, y: number, status: number };

export function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [ball, setBall] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 3, dy: -3 });
  const [bricks, setBricks] = useState<Brick[][]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const gameLoopRef = useRef<number>();

  const resetGame = () => {
    const newBricks: Brick[][] = [];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      newBricks[c] = [];
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        newBricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }
    setBricks(newBricks);
    setBall({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 3, dy: -3 });
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    setScore(0);
    setLives(3);
    setIsGameOver(false);
  };

  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || isGameOver) return;
        const relativeX = e.clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < GAME_WIDTH) {
            setPaddleX(Math.min(relativeX - PADDLE_WIDTH / 2, GAME_WIDTH - PADDLE_WIDTH));
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isGameOver]);

  useEffect(() => {
    const gameLoop = () => {
      if (isGameOver) {
        cancelAnimationFrame(gameLoopRef.current!);
        return;
      }
      
      setBall(prev => {
        let newX = prev.x + prev.dx;
        let newY = prev.y + prev.dy;
        let newDx = prev.dx;
        let newDy = prev.dy;

        if (newX > GAME_WIDTH - BALL_RADIUS || newX < BALL_RADIUS) newDx = -newDx;
        if (newY < BALL_RADIUS) newDy = -newDy;
        else if (newY > GAME_HEIGHT - BALL_RADIUS) {
            if (newX > paddleX && newX < paddleX + PADDLE_WIDTH) {
                newDy = -newDy;
            } else {
                setLives(l => l - 1);
                if (lives -1 === 0) {
                    setIsGameOver(true);
                } else {
                    return { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 3, dy: -3 };
                }
            }
        }
        return { ...prev, x: newX, y: newY, dx: newDx, dy: newDy };
      });
      
      // Brick collision
      setBricks(prevBricks => {
          let allBricksBroken = true;
          const newBricks = prevBricks.map(col => col.map(brick => {
            if (brick.status === 1) {
              allBricksBroken = false;
              if (ball.x > brick.x && ball.x < brick.x + BRICK_WIDTH && ball.y > brick.y && ball.y < brick.y + BRICK_HEIGHT) {
                setBall(b => ({ ...b, dy: -b.dy }));
                setScore(s => s + 10);
                return { ...brick, status: 0 };
              }
            }
            return brick;
          }));
          if (allBricksBroken && bricks.length > 0) {
              setIsGameOver(true);
          }
          return newBricks;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameLoopRef.current!);
  }, [isGameOver, lives, ball.x, paddleX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw paddle
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fillRect(paddleX, GAME_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary-foreground))';
    ctx.fill();
    ctx.closePath();
    
    // Draw bricks
    bricks.forEach((col, c) => col.forEach((brick, r) => {
        if (brick.status === 1) {
            const brickX = (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT;
            const brickY = (r * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.fillStyle = `hsl(var(--chart-${(c+r)%5 + 1}))`;
            ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
        }
    }));

  }, [paddleX, ball, bricks]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full px-4 text-xl font-bold">
        <span>Score: {score}</span>
        <span>Lives: {lives}</span>
      </div>
      <div className='relative'>
        <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="border-2 rounded-md border-border bg-background"
        />
        {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black/70">
                <h3 className="text-3xl font-bold">{lives === 0 ? 'Game Over' : 'You Win!'}</h3>
                <p className="text-xl">Your score: {score}</p>
                <Button onClick={resetGame} className="mt-4">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
