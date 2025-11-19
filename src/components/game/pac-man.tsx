'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Gamepad2 } from 'lucide-react';

export function PacManGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'won'>('start');
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    const touchStart = useRef<{ x: number, y: number } | null>(null);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async (finalScore: number) => {
        if (!user || !firestore || finalScore === 0 || hasSubmittedScore) return;
        try {
            const scoresCollection = collection(firestore, 'games', 'pac-man', 'scores');
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
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const container = canvas.parentElement;
            if (container) {
                const size = Math.min(container.clientWidth, 500);
                canvas.width = size;
                canvas.height = size;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const TILE_SIZE = canvas.width / 21;
        const map = [
            '#####################',
            '#o.......#.......o#',
            '#.#.###.#.###.#.###.#',
            '#.................#',
            '#.#.#.#####.#.#####',
            '#...#...#...#...#',
            '#####.### # ###.#####',
            '    #.#   #   #.#    ',
            '#####.# ##### #.#####',
            '      #       #      ',
            '#####.# ##### #.#####',
            '    #.#       #.#    ',
            '#####.# ##### #.#####',
            '#.......#.......#',
            '#.###.###.###.###.#',
            '#o..#.....P.....#..o#',
            '###.#.#.#####.#.#.###',
            '#...#...#...#...#',
            '#.#######.#######.#',
            '#o...............o#',
            '#####################',
        ];

        let pacman = { x: 10.5, y: 15.5, dir: 'left', nextDir: 'left', speed: 0.15 };
        let ghosts = [
            { x: 9.5, y: 9.5, dir: 'up', color: 'red' },
            { x: 10.5, y: 9.5, dir: 'up', color: 'pink' },
            { x: 11.5, y: 9.5, dir: 'up', color: 'cyan' },
            { x: 10.5, y: 10.5, dir: 'up', color: 'orange' }
        ];
        let dots = 0;
        let localScore = 0;
        let localLives = 3;

        setScore(0);
        setLives(3);

        const grid = map.map(row => row.split(''));
        grid.forEach(row => row.forEach(cell => { if (cell === 'o' || cell === '.') dots++; }));

        let animationFrameId: number;
        
        function canMove(x: number, y: number) {
            const gridX = Math.floor(x);
            const gridY = Math.floor(y);
            return grid[gridY] && grid[gridY][gridX] !== '#';
        }
        
        function handleInput(e: KeyboardEvent) {
            switch(e.key) {
                case 'ArrowUp': pacman.nextDir = 'up'; break;
                case 'ArrowDown': pacman.nextDir = 'down'; break;
                case 'ArrowLeft': pacman.nextDir = 'left'; break;
                case 'ArrowRight': pacman.nextDir = 'right'; break;
            }
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
    
        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current) return;
            if(e.changedTouches.length > 0) {
                const dx = e.changedTouches[0].clientX - touchStart.current.x;
                const dy = e.changedTouches[0].clientY - touchStart.current.y;
                if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                    if (Math.abs(dx) > Math.abs(dy)) pacman.nextDir = dx > 0 ? 'right' : 'left';
                    else pacman.nextDir = dy > 0 ? 'down' : 'up';
                }
            }
            touchStart.current = null;
        };

        window.addEventListener('keydown', handleInput);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);


        function gameLoop() {
            // Update Pacman
            const { x, y, speed } = pacman;
            let nextX = x, nextY = y;
            if (pacman.nextDir === 'left' && canMove(x - speed, y)) pacman.dir = 'left';
            if (pacman.nextDir === 'right' && canMove(x + speed, y)) pacman.dir = 'right';
            if (pacman.nextDir === 'up' && canMove(x, y - speed)) pacman.dir = 'up';
            if (pacman.nextDir === 'down' && canMove(x, y + speed)) pacman.dir = 'down';

            if (pacman.dir === 'left') nextX -= speed;
            if (pacman.dir === 'right') nextX += speed;
            if (pacman.dir === 'up') nextY -= speed;
            if (pacman.dir === 'down') nextY += speed;

            if (canMove(nextX, nextY)) {
                pacman.x = nextX;
                pacman.y = nextY;
            }

            // Pacman eats dots
            const gridX = Math.round(pacman.x - 0.5);
            const gridY = Math.round(pacman.y - 0.5);
            if (grid[gridY] && (grid[gridY][gridX] === '.' || grid[gridY][gridX] === 'o')) {
                localScore += grid[gridY][gridX] === '.' ? 10 : 50;
                setScore(localScore);
                grid[gridY][gridX] = ' ';
                dots--;
                if (dots === 0) {
                    setGameState('won');
                    submitScore(localScore + 1000 * localLives); // Win bonus
                }
            }
            
            // Ghost movement (simple) & collision
            ghosts.forEach(ghost => {
                let dx = pacman.x - ghost.x;
                let dy = pacman.y - ghost.y;
                let newDir = ghost.dir;
                if(Math.abs(dx) > Math.abs(dy)) newDir = dx > 0 ? 'right' : 'left';
                else newDir = dy > 0 ? 'down' : 'up';
                
                let gx = ghost.x, gy = ghost.y;
                if (newDir === 'left') gx -= 0.05;
                if (newDir === 'right') gx += 0.05;
                if (newDir === 'up') gy -= 0.05;
                if (newDir === 'down') gy += 0.05;

                if (canMove(gx, gy)) {
                    ghost.x = gx;
                    ghost.y = gy;
                }
                
                if (Math.abs(pacman.x - ghost.x) < 0.8 && Math.abs(pacman.y - ghost.y) < 0.8) {
                    localLives--;
                    setLives(localLives);
                    if (localLives === 0) {
                        setGameState('gameOver');
                        submitScore(localScore);
                    } else {
                        pacman.x = 10.5; pacman.y = 15.5;
                        ghosts.forEach(g => { g.x = 10.5; g.y = 9.5; });
                    }
                }
            });

            // Draw
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    if (grid[r][c] === '#') {
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    } else if (grid[r][c] === '.') {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(c * TILE_SIZE + TILE_SIZE/2 - 1, r * TILE_SIZE + TILE_SIZE/2 - 1, 2, 2);
                    } else if (grid[r][c] === 'o') {
                        ctx.beginPath();
                        ctx.arc(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/4, 0, 2 * Math.PI);
                        ctx.fillStyle = 'white';
                        ctx.fill();
                    }
                }
            }
            
            // Draw ghosts
            ghosts.forEach(g => {
                ctx.fillStyle = g.color;
                ctx.beginPath();
                ctx.arc((g.x) * TILE_SIZE, (g.y) * TILE_SIZE, TILE_SIZE/2, Math.PI, 0);
                ctx.lineTo((g.x + 0.5) * TILE_SIZE, (g.y + 0.5) * TILE_SIZE);
                ctx.lineTo((g.x - 0.5) * TILE_SIZE, (g.y + 0.5) * TILE_SIZE);
                ctx.fill();
            });
            
            // Draw Pacman
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(pacman.x * TILE_SIZE, pacman.y * TILE_SIZE, TILE_SIZE / 2, 0.25 * Math.PI, 1.75 * Math.PI);
            ctx.lineTo(pacman.x * TILE_SIZE, pacman.y * TILE_SIZE);
            ctx.fill();

            if (gameState === 'playing') {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
        }
        
        gameLoop();
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('keydown', handleInput);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [gameState, submitScore]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setLives(3);
        setHasSubmittedScore(false);
    };

    return (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
            <div className="relative md:col-span-2">
                <canvas ref={canvasRef} className="w-full rounded-md bg-black" />
                {(gameState !== 'playing') && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white bg-black/70">
                        <h2 className="text-3xl font-bold font-arcade">{gameState === 'start' ? 'Pac-Man' : gameState === 'won' ? 'You Win!' : 'Game Over'}</h2>
                        <p>Score: {score}</p>
                        <Button onClick={startGame} className="mt-4">
                            {gameState === 'start' ? 'Start Game' : 'Play Again'}
                        </Button>
                    </div>
                )}
            </div>
             <div className="space-y-4 md:col-span-1">
                <div className="flex justify-between w-full p-4 rounded-md bg-muted">
                    <div className='text-center'>
                        <p className="text-sm font-semibold">SCORE</p>
                        <p className="text-2xl font-bold text-primary">{score}</p>
                    </div>
                     <div className='text-center'>
                        <p className="text-sm font-semibold">LIVES</p>
                        <div className="flex justify-center gap-1">
                          {[...Array(lives)].map((_, i) => <Gamepad2 key={i} className="w-6 h-6 text-yellow-400"/>)}
                        </div>
                    </div>
                </div>
                <Leaderboard gameId="pac-man" />
            </div>
        </div>
    );
}
