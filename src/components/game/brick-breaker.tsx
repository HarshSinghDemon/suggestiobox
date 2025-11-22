
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type Particle = {
    x: number;
    y: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;
    life: number;
};

type Difficulty = 'rookie' | 'amateur' | 'pro' | 'legend';

const difficultySettings: Record<Difficulty, { speed: number; points: number; paddleWidthDivisor: number }> = {
    rookie: { speed: 2, points: 10, paddleWidthDivisor: 4 },
    amateur: { speed: 3, points: 20, paddleWidthDivisor: 5 },
    pro: { speed: 4, points: 30, paddleWidthDivisor: 6 },
    legend: { speed: 5, points: 40, paddleWidthDivisor: 7 },
};

export function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'won'>('start');
  const [score, setScore] = useState(0);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
        window.removeEventListener('resize', handleResize);
    };
}, []);


  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let ballRadius = 8;
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    
    const { speed: baseSpeed, points: pointsPerBrick, paddleWidthDivisor } = difficultySettings[difficulty];
    
    let speedMultiplier = 1;
    let dx = (Math.random() - 0.5) * baseSpeed * 1.5;
    if (Math.abs(dx) < 0.5) dx = dx > 0 ? 0.5 : -0.5;
    let dy = -baseSpeed;


    let paddleHeight = 10;
    let paddleWidth = canvas.width / paddleWidthDivisor;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let brickRowCount = 7;
    let brickColumnCount = 9;
    let brickPadding = 10;
    let brickOffsetTop = 30;
    let brickOffsetLeft = 30;
    let brickWidth = (canvas.width - (brickOffsetLeft * 2) - (brickPadding * (brickColumnCount - 1))) / brickColumnCount;
    let brickHeight = 20;

    let particles: Particle[] = [];
    let paddleHitFlash = 0;
    let ballTrail: {x: number, y: number}[] = [];
    
    const brickColors = [
        "hsl(var(--chart-1))", 
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))"
    ];
    
    let bricks: { x: number, y: number, status: number, color: string }[][] = [];
    for(let c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for(let r=0; r<brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: brickColors[r % brickColors.length] };
        }
    }
    
    let localScore = 0;
    setScore(0); // Reset score on new game
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
    
    const updatePaddlePosition = (clientX: number) => {
        const rect = canvas.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        if(relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
            if (paddleX < 0) paddleX = 0;
            if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
        }
    }

    const mouseMoveHandler = (e: MouseEvent) => {
        updatePaddlePosition(e.clientX);
    }
    
    const touchMoveHandler = (e: TouchEvent) => {
        e.preventDefault();
        if(e.touches.length > 0) updatePaddlePosition(e.touches[0].clientX);
    }
    
    const touchStartHandler = (e: TouchEvent) => {
        e.preventDefault();
        if(e.touches.length > 0) updatePaddlePosition(e.touches[0].clientX);
    };

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    document.addEventListener("mousemove", mouseMoveHandler, false);
    canvas.addEventListener("touchstart", touchStartHandler, { passive: false });
    canvas.addEventListener("touchmove", touchMoveHandler, { passive: false });
    
    const createParticles = (brick: {x:number, y:number}) => {
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: brick.x + brickWidth / 2,
                y: brick.y + brickHeight / 2,
                radius: Math.random() * 2.5 + 1.5,
                color: `hsl(0, 100%, ${Math.random() * 30 + 50}%)`,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 40,
            });
        }
    }

    function collisionDetection() {
        for(let c=0; c<brickColumnCount; c++) {
            for(let r=0; r<brickRowCount; r++) {
                let b = bricks[c][r];
                if(b.status == 1) {
                    if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                        dy = -dy;
                        b.status = 0;
                        localScore += pointsPerBrick;
                        setScore(s => s + pointsPerBrick);
                        createParticles(b);
                        if(localScore == brickRowCount*brickColumnCount*pointsPerBrick) {
                            setGameState('won');
                            submitScore(localScore + 100); // Bonus for winning
                        }
                    }
                }
            }
        }
    }

    function drawBall() {
        // Trail
        ballTrail.push({x, y});
        if(ballTrail.length > 10) ballTrail.shift();
        
        for(let i = 0; i < ballTrail.length; i++) {
            ctx!.beginPath();
            ctx!.arc(ballTrail[i].x, ballTrail[i].y, ballRadius * (i / ballTrail.length), 0, Math.PI*2);
            ctx!.fillStyle = `hsla(var(--primary-hsl), ${i / ballTrail.length * 0.5})`;
            ctx!.fill();
            ctx!.closePath();
        }

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
        if (paddleHitFlash > 0) {
            const alpha = paddleHitFlash / 10;
            ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            paddleHitFlash--;
        }
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
                    ctx!.fillStyle = bricks[c][r].color;
                    ctx!.fill();
                    ctx!.closePath();
                }
            }
        }
    }
    
    function drawParticles() {
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 1;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx!.globalAlpha = p.life / 40;
            ctx!.fillStyle = p.color;
            ctx!.fill();
            ctx!.closePath();
        });
        ctx!.globalAlpha = 1;
    }
    
    function draw() {
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        drawParticles();
        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();

        speedMultiplier = 1 + (localScore / (difficulty === 'legend' || difficulty === 'pro' ? 2500 : 5000));
        let currentDx = dx;
        let currentDy = dy;


        if(x + currentDx > canvas.width-ballRadius || x + currentDx < ballRadius) dx = -dx;
        if(y + currentDy < ballRadius) {
            dy = -dy;
        } else if(y + currentDy > canvas.height-ballRadius) {
            if(x > paddleX && x < paddleX + paddleWidth) {
                // Change angle based on where it hit the paddle
                const hitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2); // -1 to 1
                dx = hitPos * baseSpeed * 1.5; // Max horizontal speed is 1.5x base
                dy = -dy;
                paddleHitFlash = 10;
            }
            else {
                setGameState('gameOver');
                submitScore(localScore);
                return;
            }
        }

        if(rightPressed && paddleX < canvas.width-paddleWidth) paddleX += 7;
        else if(leftPressed && paddleX > 0) paddleX -= 7;

        x += dx * speedMultiplier;
        y += dy * speedMultiplier;
        animationFrameId = requestAnimationFrame(draw);
    }
    
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      canvas.removeEventListener("touchstart", touchStartHandler);
      canvas.removeEventListener("touchmove", touchMoveHandler);
    };
  }, [gameState, submitScore, difficulty]);
  
  const startGame = (selectedDifficulty: Difficulty) => {
      setDifficulty(selectedDifficulty);
      setGameState('playing');
      setScore(0);
      setHasSubmittedScore(false);
  }

  const resetGame = () => {
    setGameState('start');
  }

  return (
    <div className="relative w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full rounded-md bg-card-foreground/10" />
            {(gameState === 'gameOver' || gameState === 'won' || gameState === 'start') && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center bg-background/80">
                <h2 className="text-3xl font-bold">{gameState === 'won' ? 'You Win!' : gameState === 'gameOver' ? 'Game Over' : 'Brick Breaker'}</h2>
                <p className='text-muted-foreground'>Your Score: {score}</p>
                {gameState === 'start' ? (
                  <div className='flex flex-col gap-4 w-48'>
                    <Select value={difficulty} onValueChange={(val: Difficulty) => setDifficulty(val)}>
                        <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rookie">Rookie</SelectItem>
                            <SelectItem value="amateur">Amateur</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="legend">Legend</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => startGame(difficulty)}>Start Game</Button>
                  </div>
                ) : (
                  <Button onClick={resetGame}>Play Again</Button>
                )}
            </div>
        )}
    </div>
  );
}
