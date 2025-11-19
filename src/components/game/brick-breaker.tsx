'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'won'>('start');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 480;
    canvas.height = 320;

    let ballRadius = 10;
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    let dx = 2;
    let dy = -2;

    let paddleHeight = 10;
    let paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let brickRowCount = 3;
    let brickColumnCount = 5;
    let brickWidth = 75;
    let brickHeight = 20;
    let brickPadding = 10;
    let brickOffsetTop = 30;
    let brickOffsetLeft = 30;
    
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
        const relativeX = e.clientX - canvas.offsetLeft;
        if(relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
        }
    }
    
    const touchMoveHandler = (e: TouchEvent) => {
        e.preventDefault();
        const relativeX = e.touches[0].clientX - canvas.offsetLeft;
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
                        localScore++;
                        setScore(localScore);
                        if(localScore == brickRowCount*brickColumnCount) {
                            setGameState('won');
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
  }, [gameState]);
  
  const startGame = () => {
      setGameState('playing');
      setScore(0);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="rounded-md bg-card-foreground/10" />
      <div className="flex items-center justify-between w-full mt-4">
        <p className="font-semibold">Score: {score}</p>
        {(gameState !== 'playing') && (
            <Button onClick={startGame} size="sm">
                {gameState === 'start' ? 'Start Game' : 'Play Again'}
            </Button>
        )}
      </div>
      {(gameState === 'gameOver' || gameState === 'won') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <h2 className="text-3xl font-bold text-white">{gameState === 'won' ? 'You Win!' : 'Game Over'}</h2>
          <Button onClick={startGame} className="mt-4">Play Again</Button>
        </div>
      )}
    </div>
  );
}
