'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

const BOARD_SIZE = 8;
type Player = 'red' | 'black';
type SquareValue = Player | null;

const createInitialBoard = (): SquareValue[][] => {
    const board: SquareValue[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 === 1) board[r][c] = 'red';
        }
    }
    for (let r = 5; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 === 1) board[r][c] = 'black';
        }
    }
    return board;
};

export function CheckersGame() {
    const [board, setBoard] = useState<SquareValue[][]>(createInitialBoard());
    const [isKing, setIsKing] = useState<boolean[][]>(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false)));
    const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
    const [selectedPiece, setSelectedPiece] = useState<{ r: number, c: number } | null>(null);
    const [winner, setWinner] = useState<Player | null>(null);

    const restartGame = () => {
        setBoard(createInitialBoard());
        setIsKing(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false)));
        setCurrentPlayer('black');
        setSelectedPiece(null);
        setWinner(null);
    };

    const checkWinner = (currentBoard: SquareValue[][]) => {
        const redPieces = currentBoard.flat().filter(p => p === 'red').length;
        const blackPieces = currentBoard.flat().filter(p => p === 'black').length;
        if (redPieces === 0) setWinner('black');
        if (blackPieces === 0) setWinner('red');
    };

    const handleSquareClick = (r: number, c: number) => {
        if (winner) return;

        if (selectedPiece) {
            const { r: startR, c: startC } = selectedPiece;
            const pieceIsKing = isKing[startR][startC];
            const dr = r - startR;
            const dc = c - startC;
            const moveDir = currentPlayer === 'black' ? -1 : 1;

            const isValidMove = (pieceIsKing || dr === moveDir) && Math.abs(dc) === 1 && board[r][c] === null;
            const isValidJump = (pieceIsKing || dr === 2 * moveDir) && Math.abs(dc) === 2 && board[r][c] === null && board[startR + dr / 2][startC + dc / 2] === (currentPlayer === 'red' ? 'black' : 'red');

            if (isValidMove || isValidJump) {
                const newBoard = board.map(row => [...row]);
                const newIsKing = isKing.map(row => [...row]);
                newBoard[r][c] = currentPlayer;
                newBoard[startR][startC] = null;
                
                if(pieceIsKing){
                    newIsKing[r][c] = true;
                    newIsKing[startR][startC] = false;
                }

                if (isValidJump) {
                    newBoard[startR + dr / 2][startC + dc / 2] = null;
                }
                
                if ((currentPlayer === 'black' && r === 0) || (currentPlayer === 'red' && r === BOARD_SIZE - 1)) {
                    newIsKing[r][c] = true;
                }
                
                setBoard(newBoard);
                setIsKing(newIsKing);
                setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
                setSelectedPiece(null);
                checkWinner(newBoard);
            } else {
                setSelectedPiece(null);
            }
        } else if (board[r][c] === currentPlayer) {
            setSelectedPiece({ r, c });
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-lg font-semibold">
                {winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!` : `Turn: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`}
            </div>
            <div className="grid grid-cols-8 border-2 border-muted-foreground w-full max-w-lg aspect-square">
                {board.map((row, r) => row.map((cell, c) => (
                    <div
                        key={`${r}-${c}`}
                        className={cn(
                            "flex items-center justify-center",
                            (r + c) % 2 === 0 ? "bg-muted/50" : "bg-card-foreground/10",
                            selectedPiece?.r === r && selectedPiece?.c === c && "bg-primary/30"
                        )}
                        onClick={() => handleSquareClick(r, c)}
                    >
                        {cell && (
                            <div className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center",
                                cell === 'red' ? "bg-red-600" : "bg-black",
                                isKing[r][c] && "border-4 border-yellow-400"
                            )} />
                        )}
                    </div>
                )))}
            </div>
            <Button onClick={restartGame} variant="outline"><RotateCcw className="w-4 h-4 mr-2" />Restart Game</Button>
        </div>
    );
}
