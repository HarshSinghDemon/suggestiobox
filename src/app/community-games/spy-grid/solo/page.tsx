
'use client';

import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateSpyGridBoard, generateSpyMasterClue } from '@/ai/flows/spy-grid-flow';
import { Award, BrainCircuit, Bot, Loader2, User, Send } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

type Word = {
    word: string;
    team: 'red' | 'blue' | 'neutral' | 'assassin';
    revealed: boolean;
};

type GameState = 'setup' | 'playing' | 'finished';
type Turn = 'player_guessing' | 'ai_giving_clue';

const TEAM_CONFIG = {
    player: 'blue',
    ai: 'red',
} as const;

export default function SoloSpyGridPage() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [board, setBoard] = useState<Word[]>([]);
    const [turn, setTurn] = useState<Turn>('ai_giving_clue');
    const [scores, setScores] = useState({ red: 9, blue: 8 });
    const [aiClue, setAiClue] = useState<{ clue: string; number: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [gameOverMessage, setGameOverMessage] = useState('');

    const { toast } = useToast();

    const startNewGame = useCallback(async () => {
        setIsLoading(true);
        setGameOverMessage('');
        try {
            const { words } = await generateSpyGridBoard({ theme: "General Knowledge" });
            const initialBoard = words.map(w => ({ ...w, revealed: false }));
            setBoard(initialBoard);
            setScores({ red: 9, blue: 8 });
            setTurn('ai_giving_clue');
            setAiClue(null);
            setGameState('playing');
        } catch (error) {
            console.error("Failed to generate board:", error);
            toast({ variant: 'destructive', title: 'AI Error', description: 'Could not start a new game.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleWordClick = (index: number) => {
        if (turn !== 'player_guessing' || board[index].revealed) return;

        const newBoard = [...board];
        const clickedWord = newBoard[index];
        clickedWord.revealed = true;
        setBoard(newBoard);
        
        let newScores = { ...scores };
        
        if (clickedWord.team === TEAM_CONFIG.player) {
            newScores.blue -= 1;
            setScores(newScores);
            if(newScores.blue === 0) {
                setGameOverMessage("Congratulations, You Win!");
                setGameState('finished');
            }
        } else if (clickedWord.team === TEAM_CONFIG.ai) {
            newScores.red -= 1;
            setScores(newScores);
            toast({ variant: 'destructive', title: "Opponent's Word!", description: "You revealed a word for the AI team." });
            setTurn('ai_giving_clue'); // End player's turn
        } else if (clickedWord.team === 'neutral') {
            toast({ title: 'Neutral Word', description: 'Your turn is over.' });
            setTurn('ai_giving_clue'); // End player's turn
        } else if (clickedWord.team === 'assassin') {
            setGameOverMessage("You hit the assassin! Game Over.");
            setGameState('finished');
        }
    };
    
    // Effect to fetch AI clue when it's their turn
    useEffect(() => {
        if (gameState === 'playing' && turn === 'ai_giving_clue' && !isLoading) {
            const fetchClue = async () => {
                setIsLoading(true);
                setAiClue(null);
                try {
                    const unrevealedWords = board.map(w => ({
                        word: w.word,
                        team: w.revealed ? 'neutral' : w.team // Treat revealed words as neutral for AI
                    }));

                    const clueResult = await generateSpyMasterClue({
                        words: unrevealedWords,
                        spymasterTeam: TEAM_CONFIG.ai,
                    });
                    
                    setAiClue({ clue: clueResult.clue, number: clueResult.number });
                    toast({
                        title: `AI Spymaster's Clue: ${clueResult.clue} ${clueResult.number}`,
                        description: `Reasoning: ${clueResult.reasoning}`
                    });
                    setTurn('player_guessing');

                } catch (error) {
                    console.error("Failed to generate clue:", error);
                    toast({ variant: 'destructive', title: 'AI Error', description: 'The AI Spymaster is stumped! Please try again.' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchClue();
        }
    }, [gameState, turn, board, toast, isLoading]);


    const getCardColor = (word: Word) => {
        if (!word.revealed) return 'bg-card hover:bg-accent';
        switch (word.team) {
            case 'red': return 'bg-red-800/80 text-white';
            case 'blue': return 'bg-blue-800/80 text-white';
            case 'neutral': return 'bg-yellow-800/80 text-white';
            case 'assassin': return 'bg-black text-white';
            default: return 'bg-card';
        }
    };

    if (gameState === 'setup') {
        return (
            <AuthWrapper>
                <div className="container py-12 text-center">
                    <Button onClick={startNewGame} size="lg" disabled={isLoading}>
                        {isLoading ? <Loader2 className='mr-2 h-5 w-5 animate-spin'/> : <BrainCircuit className='mr-2 h-5 w-5'/>}
                        Start New Solo Game
                    </Button>
                </div>
            </AuthWrapper>
        )
    }

    return (
        <AuthWrapper>
            <div className="container py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3">
                         <div className="grid grid-cols-5 grid-rows-5 gap-2">
                             {board.map((word, index) => (
                                 <Card
                                     key={index}
                                     className={cn(
                                         "flex items-center justify-center p-2 text-center font-semibold cursor-pointer transition-all duration-300 transform hover:scale-105 min-h-[60px]",
                                         getCardColor(word)
                                     )}
                                     onClick={() => handleWordClick(index)}
                                 >
                                     {word.word}
                                 </Card>
                             ))}
                         </div>
                    </div>
                    <div className="space-y-4">
                        <Card className="text-center bg-blue-900/30 border-blue-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2">
                                    <User /> Your Team (Blue)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{scores.blue}</p>
                                <p className="text-sm text-muted-foreground">words left</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center bg-red-900/30 border-red-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2">
                                    <Bot /> AI Team (Red)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{scores.red}</p>
                                <p className="text-sm text-muted-foreground">words left</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg text-center">Game Info</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                {gameState === 'finished' ? (
                                    <div className="space-y-2">
                                        <Award className="w-12 h-12 mx-auto text-yellow-500"/>
                                        <p className="font-bold text-xl">{gameOverMessage}</p>
                                        <Button onClick={startNewGame}>Play Again</Button>
                                    </div>
                                ) : isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>AI is thinking...</span>
                                    </div>
                                ) : aiClue ? (
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">AI Clue:</p>
                                        <p className="text-2xl font-bold tracking-widest uppercase">{aiClue.clue} <span className="text-primary">{aiClue.number}</span></p>
                                    </div>
                                ) : null}
                                 {turn === 'player_guessing' && !isLoading && gameState === 'playing' && (
                                    <Button variant="outline" size="sm" onClick={() => setTurn('ai_giving_clue')}>
                                        <Send className="w-4 h-4 mr-2"/>
                                        End Turn
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}
