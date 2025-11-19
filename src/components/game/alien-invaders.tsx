'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export function AlienInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'won' | 'start'>('start');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 480;
    canvas.height = 320;

    let player = { x: canvas.width / 2 - 15, y: canvas.height - 30, width: 30, height: 10, dx: 4 };
    let bullets: { x: number; y: number; width: number; height: number; dy: number }[] = [];
    let invaders: { x: number; y: number; width: number; height: number; alive: boolean }[] = [];
    let rightPressed = false;
    let leftPressed = false;
    let invaderDirection = 1;
    let invaderSpeed = 0.5;
    let frameId: number;

    const invaderRowCount = 3;
    const invaderColumnCount = 8;
    const invaderWidth = 30;
    const invaderHeight = 20;
    const invaderPadding = 10;
    const invaderOffsetTop = 30;
    const invaderOffsetLeft = 30;

    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        invaders.push({
          x: c * (invaderWidth + invaderPadding) + invaderOffsetLeft,
          y: r * (invaderHeight + invaderPadding) + invaderOffsetTop,
          width: invaderWidth,
          height: invaderHeight,
          alive: true
        });
      }
    }

    function drawPlayer() {
      ctx!.fillStyle = '#00f';
      ctx!.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawInvaders() {
      invaders.forEach(invader => {
        if (invader.alive) {
          ctx!.fillStyle = '#0f0';
          ctx!.fillRect(invader.x, invader.y, invader.width, invader.height);
        }
      });
    }

    function drawBullets() {
      bullets.forEach(bullet => {
        ctx!.fillStyle = '#f00';
        ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });
    }

    function collisionDetection() {
      bullets.forEach((bullet, bIndex) => {
        invaders.forEach((invader, iIndex) => {
          if (
            invader.alive &&
            bullet.x > invader.x &&
            bullet.x < invader.x + invader.width &&
            bullet.y > invader.y &&
            bullet.y < invader.y + invader.height
          ) {
            invader.alive = false;
            bullets.splice(bIndex, 1);
            setScore(prev => prev + 10);
          }
        });
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      drawPlayer();
      drawInvaders();
      drawBullets();
      collisionDetection();
      
      let edge = false;
      invaders.forEach(invader => {
        if(invader.alive){
            invader.x += invaderSpeed * invaderDirection;
            if(invader.x + invaderWidth > canvas!.width || invader.x < 0){
                edge = true;
            }
            if(invader.y + invaderHeight > player.y){
                setGameState('gameOver');
            }
        }
      });

      if(edge){
        invaderDirection *= -1;
        invaders.forEach(invader => {
            invader.y += 10;
        });
      }


      if (rightPressed && player.x < canvas!.width - player.width) {
        player.x += player.dx;
      } else if (leftPressed && player.x > 0) {
        player.x -= player.dx;
      }

      bullets.forEach((bullet, index) => {
        bullet.y -= bullet.dy;
        if (bullet.y < 0) {
          bullets.splice(index, 1);
        }
      });

      if (invaders.every(invader => !invader.alive)) {
        setGameState('won');
        return;
      }

      frameId = requestAnimationFrame(draw);
    }
    
    function keyDownHandler(e: KeyboardEvent) {
      if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
      else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
      else if (e.key === " ") {
        bullets.push({ x: player.x + player.width / 2 - 1, y: player.y, width: 2, height: 10, dy: 7 });
      }
    }

    function keyUpHandler(e: KeyboardEvent) {
      if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
      else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    }

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };

  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="rounded-md bg-card-foreground/10" />
      <div className="mt-4">
        {gameState === 'start' && <Button onClick={startGame}>Start Game</Button>}
        {(gameState === 'gameOver' || gameState === 'won') && (
          <div className="text-center">
            <h3 className="text-xl font-bold">{gameState === 'gameOver' ? 'Game Over' : 'You Won!'}</h3>
            <p>Your Score: {score}</p>
            <Button onClick={startGame} className="mt-2">Play Again</Button>
          </div>
        )}
        {gameState === 'playing' && <p>Score: {score}</p>}
      </div>
    </div>
  );
}
