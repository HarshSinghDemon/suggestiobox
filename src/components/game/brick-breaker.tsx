'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';

export function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'won'>('start');
  const [score, setScore] = useState(0);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || !firestore || finalScore === 0 || hasSubmittedScore) return;

    try {
        const scoresCollection = collection(firestore, 'games', 'brick-breaker', 'scores');
        await addDocumentNonBlocking(scoresCollection, {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userImage: user.photoURL,
            score: finalScore,
            createdAt: serverTimestamp(),
        });
        setHasSubmittedScore(true);
        toast({
          title: "Game Over!",
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
  }, [user, firestore, toast, hasSubmittedScore]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let container = canvas.parentElement;
    canvas.width = container?.clientWidth || 480;
    canvas.height = (container?.clientWidth || 480) * (2/3);

    let ballRadius = 8;
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    let dx = 2;
    let dy = -2;

    let paddleHeight = 10;
    let paddleWidth = canvas.width / 6.4;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let brickRowCount = 5;
    let brickColumnCount = 7;
    let brickPadding = 10;
    let brickOffsetTop = 30;
    let brickOffsetLeft = 30;
    let brickWidth = (canvas.width - (brickOffsetLeft * 2) - (brickPadding * (brickColumnCount - 1))) / brickColumnCount;
    let brickHeight = 15;
    
    let bricks: { x: number, y: number, status: number }[][] = [];
    for(let c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for(let r=0; r<brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
    
    let localScore = 0;
    let rightPressed = false;
    let leftPressed = false;
    let animationFrameId: number;

    const keyDownHandler = (e: KeyboardEvent) => {
        if(e.key == "Right" || e.key == "ArrowRight") rightPressed = true;
        else if(e.key == "Left" || e.key == "ArrowLeft") leftPressed = true;
    }
    const keyUpHandler = (e: KeyboardEvent) => {
        if(e.key == "Right" || e.key == "ArrowRight") rightPressed = false;
        else if(e.key == "Left" || e.key == "ArrowLeft") leftPressed = false;
    }

    const mouseMoveHandler = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        if(relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
        }
    }
    
    const touchMoveHandler = (e: TouchEvent) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const relativeX = e.touches[0].clientX - rect.left;
        if(relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth/2;
        }
    }

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    document.addEventListener("mousemove", mouseMoveHandler, false);
    canvas.addEventListener("touchmove", touchMoveHandler, false);

    function collisionDetection() {
        for(let c=0; c<brickColumnCount; c++) {
            for(let r=0; r<brickRowCount; r++) {
                let b = bricks[c][r];
                if(b.status == 1) {
                    if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                        dy = -dy;
                        b.status = 0;
                        localScore += 10;
                        setScore(localScore);
                        if(localScore == brickRowCount*brickColumnCount*10) {
                            setGameState('won');
                            submitScore(localScore + 100); // Bonus for winning
                        }
                    }
                }
            }
        }
    }

    function drawBall() {
        ctx!.beginPath();
        ctx!.arc(x, y, ballRadius, 0, Math.PI*2);
        ctx!.fillStyle = "hsl(var(--primary))";
        ctx!.fill();
        ctx!.closePath();
    }
    function drawPaddle() {
        ctx!.beginPath();
        ctx!.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
        ctx!.fillStyle = "hsl(var(--primary))";
        ctx!.fill();
        ctx!.closePath();
    }
    function drawBricks() {
        for(let c=0; c<brickColumnCount; c++) {
            for(let r=0; r<brickRowCount; r++) {
                if(bricks[c][r].status == 1) {
                    let brickX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
                    let brickY = (r*(brickHeight+brickPadding))+brickOffsetTop;
                    bricks[c][r].x = brickX;
                    bricks[c][r].y = brickY;
                    ctx!.beginPath();
                    ctx!.rect(brickX, brickY, brickWidth, brickHeight);
                    ctx!.fillStyle = "hsl(var(--accent))";
                    ctx!.fill();
                    ctx!.closePath();
                }
            }
        }
    }
    
    function draw() {
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();

        if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) dx = -dx;
        if(y + dy < ballRadius) {
            dy = -dy;
        } else if(y + dy > canvas.height-ballRadius) {
            if(x > paddleX && x < paddleX + paddleWidth) {
                dy = -dy;
            }
            else {
                setGameState('gameOver');
                submitScore(localScore);
                return;
            }
        }

        if(rightPressed && paddleX < canvas.width-paddleWidth) paddleX += 7;
        else if(leftPressed && paddleX > 0) paddleX -= 7;

        x += dx;
        y += dy;
        animationFrameId = requestAnimationFrame(draw);
    }
    
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      canvas.removeEventListener("touchmove", touchMoveHandler);
    };
  }, [gameState, submitScore]);
  
  const startGame = () => {
      setGameState('playing');
      setScore(0);
      setHasSubmittedScore(false);
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="relative md:col-span-2">
            <canvas ref={canvasRef} className="w-full rounded-md bg-card-foreground/10" />
             {(gameState === 'gameOver' || gameState === 'won' || gameState === 'start') && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80">
                    <h2 className="text-3xl font-bold">{gameState === 'won' ? 'You Win!' : gameState === 'gameOver' ? 'Game Over' : 'Brick Breaker'}</h2>
                    <Button onClick={startGame} className="mt-4">
                        {gameState === 'start' ? 'Start Game' : 'Play Again'}
                    </Button>
                </div>
            )}
        </div>
        <div className="space-y-4 md:col-span-1">
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-muted">
                <p className="text-lg font-semibold">Score</p>
                <p className="text-3xl font-bold text-primary">{score}</p>
            </div>
            <Leaderboard gameId="brick-breaker" />
        </div>
    </div>
  );
}
