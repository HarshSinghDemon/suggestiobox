'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

const SHAPES = [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1],[0,0,0]], // T
    [[0,1,1],[1,1,0],[0,0,0]], // S
    [[1,1,0],[0,1,1],[0,0,0]], // Z
    [[1,0,0],[1,1,1],[0,0,0]], // L
    [[0,0,1],[1,1,1],[0,0,0]], // J
];

const COLORS = [
    'transparent', // 0 is empty
    '#3b82f6', // blue-500 for I
    '#facc15', // yellow-400 for O
    '#a855f7', // purple-500 for T
    '#22c55e', // green-500 for S
    '#ef4444', // red-500 for Z
    '#f97316', // orange-500 for L
    '#eab308', // amber-500 for J
];

const createEmptyBoard = (): number[][] => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export function TetrisGame() {
    const [board, setBoard] = useState(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState(getRandomPiece());
    const [nextPiece, setNextPiece] = useState(getRandomPiece());
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
    
    const gameLoopRef = useRef<number>();
    const lastTime = useRef(0);
    const dropCounter = useRef(0);
    
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);


    function getRandomPiece() {
        const randIndex = Math.floor(Math.random() * SHAPES.length);
        return {
            shape: SHAPES[randIndex],
            colorIndex: randIndex + 1,
            pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
        };
    }
    
    const submitScore = useCallback(async () => {
        if (!user || !firestore || hasSubmittedScore || score === 0) return;
        try {
          const scoresCollection = collection(firestore, 'games', 'tetris', 'scores');
          await addDocumentNonBlocking(scoresCollection, {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userImage: user.photoURL,
            score: score,
            createdAt: serverTimestamp(),
          });
          setHasSubmittedScore(true);
          toast({
            title: "Score Submitted!",
            description: `Your score of ${score} has been saved.`,
          });
        } catch (error) {
          console.error("Error submitting score:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not submit your score.",
          });
        }
      }, [user, firestore, score, hasSubmittedScore, toast]);


    const resetGame = useCallback(() => {
        setBoard(createEmptyBoard());
        setCurrentPiece(getRandomPiece());
        setNextPiece(getRandomPiece());
        setScore(0);
        setIsGameOver(false);
        setHasSubmittedScore(false);
        lastTime.current = 0;
        dropCounter.current = 0;
    }, []);

    const isValidMove = useCallback((pieceShape: number[][], piecePos: {x:number, y:number}) => {
        for (let y = 0; y < pieceShape.length; y++) {
            for (let x = 0; x < pieceShape[y].length; x++) {
                if (pieceShape[y][x]) {
                    const newX = piecePos.x + x;
                    const newY = piecePos.y + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || (board[newY] && board[newY][newX] !== 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, [board]);

    const movePiece = useCallback((dx: number) => {
        if (isGameOver) return;
        const newPos = { x: currentPiece.pos.x + dx, y: currentPiece.pos.y };
        if (isValidMove(currentPiece.shape, newPos)) {
            setCurrentPiece(prev => ({ ...prev, pos: newPos }));
        }
    }, [currentPiece, isGameOver, isValidMove]);
    
    const dropPiece = useCallback(() => {
        if (isGameOver) return;
        const newPos = { x: currentPiece.pos.x, y: currentPiece.pos.y + 1 };
        if (isValidMove(currentPiece.shape, newPos)) {
            setCurrentPiece(prev => ({ ...prev, pos: newPos }));
        } else {
            setBoard(prevBoard => {
                const newBoard = prevBoard.map(row => [...row]);
                currentPiece.shape.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value) {
                            if (currentPiece.pos.y + y < 0) return; // Prevent writing out of bounds
                            newBoard[currentPiece.pos.y + y][currentPiece.pos.x + x] = currentPiece.colorIndex;
                        }
                    });
                });
                
                let linesCleared = 0;
                for (let y = newBoard.length - 1; y >= 0; y--) {
                    if (newBoard[y].every(val => val !== 0)) {
                        linesCleared++;
                        newBoard.splice(y, 1);
                        newBoard.unshift(Array(COLS).fill(0));
                        y++;
                    }
                }
                if(linesCleared > 0) {
                     setScore(s => s + [0, 40, 100, 300, 1200][linesCleared]);
                }
                return newBoard;
            });
            
            const newPiece = nextPiece;
            setNextPiece(getRandomPiece());

            if (!isValidMove(newPiece.shape, newPiece.pos)) {
                setIsGameOver(true);
            } else {
                setCurrentPiece(newPiece);
            }
        }
        dropCounter.current = 0;
    }, [currentPiece, isGameOver, isValidMove, nextPiece]);
    
    const rotatePiece = useCallback(() => {
        if (isGameOver) return;
        const shape = currentPiece.shape;
        const newShape: number[][] = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        if (isValidMove(newShape, currentPiece.pos)) {
            setCurrentPiece(prev => ({ ...prev, shape: newShape }));
        }
    }, [currentPiece, isGameOver, isValidMove]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'r' && (e.metaKey || e.ctrlKey)) return;
            e.preventDefault();
            switch (e.key) {
                case 'ArrowLeft': movePiece(-1); break;
                case 'ArrowRight': movePiece(1); break;
                case 'ArrowDown': dropPiece(); break;
                case 'ArrowUp': rotatePiece(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePiece, dropPiece, rotatePiece]);

    useEffect(() => {
        if(isGameOver && !hasSubmittedScore) {
            submitScore();
        }
    }, [isGameOver, hasSubmittedScore, submitScore]);
    
    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = 'hsl(var(--card))';
        ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
        
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = 'hsl(var(--background))';
                    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = COLORS[currentPiece.colorIndex];
                    ctx.fillRect((currentPiece.pos.x + x) * BLOCK_SIZE, (currentPiece.pos.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = 'hsl(var(--background))';
                    ctx.strokeRect((currentPiece.pos.x + x) * BLOCK_SIZE, (currentPiece.pos.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }, [board, currentPiece]);
    
    useEffect(() => {
        let animationFrameId: number;
        const update = (time = 0) => {
            if (isGameOver) {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                return;
            }
            const deltaTime = time - lastTime.current;
            lastTime.current = time;
            dropCounter.current += deltaTime;
            const dropInterval = 1000 - (score / 100);
            if (dropCounter.current > Math.max(200, dropInterval)) {
                dropPiece();
            }
            
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) draw(ctx);
            }
            animationFrameId = requestAnimationFrame(update);
        }
        
        resetGame();
        update();

        return () => {
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    }, [resetGame, dropPiece, draw, isGameOver, score]);


    const NextPieceDisplay = () => (
        <div className='grid grid-cols-4 gap-1 p-2 bg-card rounded-md'>
            {nextPiece.shape.map((row, y) => row.map((val, x) => (
                <div key={`${y}-${x}`} className="w-4 h-4" style={{
                    backgroundColor: val ? COLORS[nextPiece.colorIndex] : 'transparent'
                }} />
            )))}
        </div>
    )

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center col-span-1 md:col-span-2 gap-4">
                <div className="relative">
                    <canvas 
                        ref={canvasRef} 
                        width={COLS * BLOCK_SIZE} 
                        height={ROWS * BLOCK_SIZE}
                        className="rounded-md border border-border"
                    />
                    {isGameOver && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80">
                            <p className="text-3xl font-bold text-destructive">Game Over</p>
                            <Button onClick={resetGame} size="sm" className="mt-4">
                                <RotateCcw className="w-4 h-4 mr-2"/>
                                Play Again
                            </Button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
                    <Button size="icon" onClick={() => movePiece(-1)}><ArrowLeft/></Button>
                    <Button size="icon" onClick={() => rotatePiece()}><RotateCw/></Button>
                    <Button size="icon" onClick={() => movePiece(1)}><ArrowRight/></Button>
                    <div />
                    <Button size="icon" onClick={() => dropPiece()}><ArrowDown/></Button>
                    <div />
                </div>
            </div>
             <div className="flex flex-col col-span-1 gap-4">
                <div className='p-4 space-y-2 rounded-md bg-muted'>
                    <div className='text-sm font-semibold'>SCORE</div>
                    <div className='text-3xl font-bold text-primary'>{score}</div>
                </div>
                <div className='p-4 space-y-2 rounded-md bg-muted'>
                     <div className='text-sm font-semibold'>NEXT</div>
                     <NextPieceDisplay />
                </div>
                <Button onClick={resetGame} size="sm" variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2"/>
                    Reset
                </Button>
                <div className="mt-4">
                    <Leaderboard gameId="tetris" />
                </div>
            </div>
        </div>
    );
}
