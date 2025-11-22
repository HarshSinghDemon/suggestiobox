'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { Chess } from 'chess.js';

type Player = 'w' | 'b';
type Piece = { type: string, color: Player };

const pieceUnicode: Record<string, string> = {
    p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔',
    P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚',
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

    const makeRandomMove = useCallback(() => {
        const moves = game.moves();
        if (moves.length > 0) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            game.move(move);
            setBoard(game.board());
            updateStatus();
        }
    }, [game, updateStatus]);

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
                    
                    setTimeout(() => makeRandomMove(), 500);

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
            <Button onClick={restartGame} variant="outline"><RotateCcw className="w-4 h-4 mr-2" />New Game</Button>
        </div>
    );
}
