'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function PongGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState({ player: 0, cpu: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || gameState !== 'playing') return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                const width = Math.min(container.clientWidth, 800);
                canvas.width = width;
                canvas.height = width * 0.6;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let paddleWidth = 10;
        let paddleHeight = canvas.height / 5;
        
        let player = { x: 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, dy: 0 };
        let cpu = { x: canvas.width - 20, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, dy: 0 };
        let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 8, speed: 5, dx: 5, dy: 5 };

        let upPressed = false;
        let downPressed = false;

        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === 'w' || e.key === 'ArrowUp') upPressed = true;
            else if (e.key === 's' || e.key === 'ArrowDown') downPressed = true;
        };
        const keyUpHandler = (e: KeyboardEvent) => {
            if (e.key === 'w' || e.key === 'ArrowUp') upPressed = false;
            else if (e.key === 's' || e.key === 'ArrowDown') downPressed = false;
        };
        const mouseMoveHandler = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            player.y = e.clientY - rect.top - player.height / 2;
        };
        const touchMoveHandler = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                 const rect = canvas.getBoundingClientRect();
                 player.y = e.touches[0].clientY - rect.top - player.height / 2;
            }
        };

        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);
        canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });

        let animationFrameId: number;

        const resetBall = () => {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.dx = -ball.dx;
            ball.speed = 5;
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Player paddle movement
            if (upPressed) player.y -= 5;
            if (downPressed) player.y += 5;

            // CPU paddle movement (simple AI)
            const cpuCenter = cpu.y + cpu.height / 2;
            if (cpuCenter < ball.y - 15) cpu.y += 4;
            else if (cpuCenter > ball.y + 15) cpu.y -= 4;

            // Paddle bounds
            if (player.y < 0) player.y = 0;
            if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
            if (cpu.y < 0) cpu.y = 0;
            if (cpu.y + cpu.height > canvas.height) cpu.y = canvas.height - cpu.height;

            // Ball movement
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Ball collision with top/bottom
            if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
                ball.dy = -ball.dy;
            }

            // Ball collision with paddles
            if ((ball.x - ball.radius < player.x + player.width && ball.y > player.y && ball.y < player.y + player.height) ||
                (ball.x + ball.radius > cpu.x && ball.y > cpu.y && ball.y < cpu.y + cpu.height)) {
                ball.dx = -ball.dx;
                ball.speed *= 1.05; // Increase speed slightly
            }

            // Scoring
            if (ball.x - ball.radius < 0) {
                setScore(s => ({ ...s, cpu: s.cpu + 1 }));
                resetBall();
            } else if (ball.x + ball.radius > canvas.width) {
                setScore(s => ({ ...s, player: s.player + 1 }));
                resetBall();
            }

            // Draw elements
            ctx.fillStyle = 'hsl(var(--primary-foreground))';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            ctx.fillRect(cpu.x, cpu.y, cpu.width, cpu.height);
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw center line
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.strokeStyle = 'hsl(var(--primary-foreground) / 0.5)';
            ctx.stroke();

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            canvas.removeEventListener('mousemove', mouseMoveHandler);
            canvas.removeEventListener('touchmove', touchMoveHandler);
        };
    }, [gameState]);
    
    useEffect(() => {
        if(score.player >= 5 || score.cpu >= 5) {
            setGameState('gameOver');
        }
    }, [score]);
    
    const startGame = () => {
        setScore({ player: 0, cpu: 0 });
        setGameState('playing');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-around w-full max-w-md p-2 mb-2 text-2xl font-bold rounded-md bg-muted">
                <span className="text-primary">{score.player}</span>
                <span>-</span>
                <span className="text-destructive">{score.cpu}</span>
            </div>
            <div className="relative w-full">
                <canvas ref={canvasRef} className="w-full bg-card-foreground/10 rounded-md" />
                {gameState !== 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center bg-background/80">
                        <h2 className="text-3xl font-bold">
                            {gameState === 'start' ? 'Pong' : `Game Over! ${score.player > score.cpu ? 'You Win!' : 'CPU Wins!'}`}
                        </h2>
                        <Button onClick={startGame} size="lg">
                            {gameState === 'start' ? 'Start Game' : 'Play Again'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
