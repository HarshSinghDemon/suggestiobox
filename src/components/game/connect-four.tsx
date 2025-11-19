'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from './leaderboard';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROWS = 6;
const COLS = 7;

type Player = '1' | '2';
type Cell = Player | null;
type Board = Cell[][];

const createEmptyBoard = (): Board => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

export function ConnectFourGame() {
    const [board, setBoard] = useState<Board>(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('1');
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);
    const [wins, setWins] = useState({ player1: 0, player2: 0 });
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const submitScore = useCallback(async () => {
        if (!user || !firestore || hasSubmittedScore || winner !== '1') return;
        const score = wins.player1 * 100 - wins.player2 * 50;
        if(score <= 0) return;
        try {
            const scoresCollection = collection(firestore, 'games', 'connect-four', 'scores');
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
                description: `Your score has been updated.`,
            });
        } catch (error) {
            console.error("Error submitting score:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not submit your score.",
            });
        }
    }, [user, firestore, toast, hasSubmittedScore, winner, wins]);

    const checkWinner = (boardToCheck: Board): Player | 'draw' | null => {
        // Horizontal, Vertical, Diagonal checks
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const p = boardToCheck[r][c];
                if (p) {
                    if (c + 3 < COLS && p === boardToCheck[r][c+1] && p === boardToCheck[r][c+2] && p === boardToCheck[r][c+3]) return p;
                    if (r + 3 < ROWS) {
                        if (p === boardToCheck[r+1][c] && p === boardToCheck[r+2][c] && p === boardToCheck[r+3][c]) return p;
                        if (c + 3 < COLS && p === boardToCheck[r+1][c+1] && p === boardToCheck[r+2][c+2] && p === boardToCheck[r+3][c+3]) return p;
                        if (c - 3 >= 0 && p === boardToCheck[r+1][c-1] && p === boardToCheck[r+2][c-2] && p === boardToCheck[r+3][c-3]) return p;
                    }
                }
            }
        }
        if (boardToCheck.every(row => row.every(cell => cell))) return 'draw';
        return null;
    };

    const handleColumnClick = (col: number) => {
        if (winner || board[0][col]) return;

        const newBoard = board.map(row => [...row]);
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!newBoard[r][col]) {
                newBoard[r][col] = currentPlayer;
                setBoard(newBoard);
                const gameWinner = checkWinner(newBoard);
                if (gameWinner) {
                    setWinner(gameWinner);
                    if(gameWinner === '1') setWins(w => ({ ...w, player1: w.player1 + 1}));
                    if(gameWinner === '2') setWins(w => ({ ...w, player2: w.player2 + 1}));
                } else {
                    setCurrentPlayer(currentPlayer === '1' ? '2' : '1');
                }
                break;
            }
        }
    };
    
    useEffect(() => {
        if (winner === '1') {
            submitScore();
        }
    }, [winner, submitScore]);
    
    useEffect(() => {
        if(currentPlayer === '2' && !winner){
            const timeout = setTimeout(() => {
                let availableCols = [];
                for(let c=0; c < COLS; c++){
                    if(!board[0][c]) availableCols.push(c);
                }
                if(availableCols.length > 0){
                    const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
                    handleColumnClick(randomCol);
                }
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [currentPlayer, board, winner]);

    const resetBoard = () => {
        setBoard(createEmptyBoard());
        setCurrentPlayer('1');
        setWinner(null);
    };

    const restartGame = () => {
        resetBoard();
        setWins({ player1: 0, player2: 0 });
        setHasSubmittedScore(false);
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 md:col-span-2">
                <div className="p-2 rounded-lg bg-blue-900/50">
                    <div className="grid gap-1" style={{gridTemplateColumns: `repeat(${COLS}, 1fr)`}}>
                        {board.map((row, r) => row.map((cell, c) => (
                            <div key={`${r}-${c}`} onClick={() => handleColumnClick(c)} className="w-8 h-8 rounded-full sm:w-12 sm:h-12 bg-background flex items-center justify-center cursor-pointer">
                                {cell && (
                                    <div className={cn("w-6 h-6 sm:w-10 sm:h-10 rounded-full", cell === '1' ? 'bg-yellow-400' : 'bg-red-500')} />
                                )}
                            </div>
                        )))}
                    </div>
                </div>
                 {winner && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">
                            {winner === 'draw' ? "It's a Draw!" : winner === '1' ? 'You Win!' : 'Computer Wins!'}
                        </h2>
                        <Button onClick={resetBoard} variant="outline" className="mt-2">Next Round</Button>
                    </div>
                )}
            </div>
            <div className="space-y-4">
                <div className="p-4 text-center rounded-md bg-muted">
                    <h3 className="font-semibold">Score</h3>
                    <p className="text-lg">You: {wins.player1} - CPU: {wins.player2}</p>
                    <p className="text-sm text-muted-foreground">
                        {winner ? `Winner: ${winner === '1' ? 'You' : winner === '2' ? 'CPU' : 'Draw'}` : `Current Turn: ${currentPlayer === '1' ? 'You' : 'CPU'}`}
                    </p>
                </div>
                 <Button onClick={restartGame} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                </Button>
                <Leaderboard gameId="connect-four" />
            </div>
        </div>
    );
}
