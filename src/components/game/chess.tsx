
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { Chess } from 'chess.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type Player = 'w' | 'b';
type Piece = { type: string, color: Player };
type Difficulty = 'rookie' | 'amateur' | 'pro' | 'legend';

const pieceUnicode: Record<string, string> = {
    p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔',
    P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚',
};

const pieceValues: Record<string, number> = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
};

const getPieceCode = (piece: Piece) => {
    return piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
};

export function ChessGame() {
    const [game, setGame] = useState(new Chess());
    const [board, setBoard] = useState(game.board());
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [status, setStatus] = useState("White's turn");
    const [isClient, setIsClient] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('rookie');

    useEffect(() => {
        setIsClient(true);
    }, []);

    const updateStatus = useCallback(() => {
        let moveColor = game.turn() === 'b' ? 'Black' : 'White';

        if (game.isCheckmate()) {
            setStatus(`Checkmate! ${moveColor === 'White' ? 'Black' : 'White'} wins.`);
            setIsGameOver(true);
        } else if (game.isDraw()) {
            setStatus('Draw!');
            setIsGameOver(true);
        } else {
            setStatus(`${moveColor}'s turn`);
            if (game.isCheck()) {
                setStatus(prev => `${prev} - Check!`);
            }
        }
    }, [game]);
    
    const evaluateBoard = (board: (Piece | null)[][]): number => {
        let total = 0;
        board.forEach(row => {
            row.forEach(piece => {
                if(piece) {
                    total += pieceValues[piece.type] * (piece.color === 'w' ? 1 : -1);
                }
            });
        });
        return total;
    }

    const getBestMove = (gameInstance: Chess, isMaximizingPlayer: boolean): string | null => {
        const moves = gameInstance.moves();
        if (moves.length === 0) return null;

        let bestMove = null;
        let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

        for(const move of moves) {
            gameInstance.move(move);
            const boardValue = evaluateBoard(gameInstance.board());
            gameInstance.undo();
            
            if (isMaximizingPlayer) {
                if (boardValue > bestValue) {
                    bestValue = boardValue;
                    bestMove = move;
                }
            } else {
                if (boardValue < bestValue) {
                    bestValue = boardValue;
                    bestMove = move;
                }
            }
        }
        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }

    const makeAIMove = useCallback(() => {
        const moves = game.moves();
        if (moves.length > 0) {
            let move;
            if (difficulty === 'legend' || difficulty === 'pro') {
                move = getBestMove(game, false); // false for black (minimizing player)
            } else if (difficulty === 'amateur') {
                move = Math.random() < 0.5 ? getBestMove(game, false) : moves[Math.floor(Math.random() * moves.length)];
            } else { // rookie
                move = moves[Math.floor(Math.random() * moves.length)];
            }
            
            if(move) game.move(move);
            
            setBoard(game.board());
            updateStatus();
        }
    }, [game, updateStatus, difficulty]);

    const handleSquareClick = (square: string, piece: Piece | null) => {
        if (isGameOver || game.turn() !== 'w') return;

        if (selectedSquare) {
            try {
                const move = game.move({
                    from: selectedSquare,
                    to: square,
                    promotion: 'q' // auto-promote to queen for simplicity
                });

                if (move) {
                    setBoard(game.board());
                    updateStatus();
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                    
                    setTimeout(() => makeAIMove(), 500);

                } else {
                    // Invalid move, maybe select new piece?
                    if (piece && piece.color === 'w') {
                        setSelectedSquare(square);
                        setPossibleMoves(game.moves({ square: square, verbose: true }).map(m => m.to));
                    } else {
                        setSelectedSquare(null);
                        setPossibleMoves([]);
                    }
                }
            } catch (e) {
                console.log("Invalid move", e);
                setSelectedSquare(null);
                setPossibleMoves([]);
            }
        } else if (piece && piece.color === 'w') {
            setSelectedSquare(square);
            setPossibleMoves(game.moves({ square: square, verbose: true }).map(m => m.to));
        }
    };
    
    const restartGame = () => {
        const newGame = new Chess();
        setGame(newGame);
        setBoard(newGame.board());
        setSelectedSquare(null);
        setPossibleMoves([]);
        setIsGameOver(false);
        setStatus("White's turn");
    };

    if (!isClient) return null;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="font-semibold">{status}</div>
            <div className="grid grid-cols-8 w-full max-w-lg aspect-square">
                {board.map((row, r) => row.map((piece, c) => {
                    const squareName = `${String.fromCharCode(97 + c)}${8 - r}` as string;
                    return (
                        <div
                            key={squareName}
                            className={cn(
                                "flex items-center justify-center text-4xl",
                                (r + c) % 2 === 0 ? "bg-muted" : "bg-card-foreground/10",
                                possibleMoves.includes(squareName) && "bg-primary/30",
                                selectedSquare === squareName && "bg-primary/50"
                            )}
                            onClick={() => handleSquareClick(squareName, piece)}
                        >
                            {piece && <span>{pieceUnicode[getPieceCode(piece)]}</span>}
                        </div>
                    );
                }))}
            </div>
            <div className="flex items-center gap-4">
                <Button onClick={restartGame} variant="outline"><RotateCcw className="w-4 h-4 mr-2" />New Game</Button>
                <div className='w-48'>
                    <Select value={difficulty} onValueChange={(d: Difficulty) => { setDifficulty(d); restartGame(); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rookie">Rookie</SelectItem>
                            <SelectItem value="amateur">Amateur</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="legend">Legend</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
