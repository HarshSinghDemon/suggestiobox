
'use client';

import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { quizMaster } from '@/ai/flows/quiz-master-flow';
import type { QuizQuestion } from '@/lib/types';
import { BrainCircuit, CheckCircle, Loader2, PartyPopper, Timer, Trophy, XCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { addDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from '@/components/game/leaderboard';


type GameState = 'setup' | 'playing' | 'result' | 'finished';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
const CATEGORIES = ["General Knowledge", "Computer Science", "History", "Science & Nature", "Movies"];

const getPoints = (timeLeft: number, difficulty: Difficulty) => {
    const difficultyMultiplier = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 1.5 : 2;
    return Math.floor((50 + timeLeft * 5) * difficultyMultiplier);
};

export default function SoloQuizPage() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [category, setCategory] = useState<string>('General Knowledge');
    const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const currentQuestion = questions[currentQuestionIndex];

    useEffect(() => {
        if (gameState !== 'playing' || !currentQuestion) return;
        
        let timer: NodeJS.Timeout;
        if (timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && selectedAnswer === null) {
            setSelectedAnswer('__timeout__');
            toast({ variant: 'destructive', title: "Time's up!" });
        }
        return () => clearTimeout(timer);
    }, [gameState, timeLeft, selectedAnswer, currentQuestion]);

    const startGame = async () => {
        setIsLoading(true);
        try {
            const response = await quizMaster({ category, difficulty, count: 10 });
            if (response.questions.length === 0) {
                toast({ variant: 'destructive', title: 'AI Error', description: 'The AI failed to generate questions. Please try again.' });
                return;
            }
            setQuestions(response.questions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setGameState('playing');
            setTimeLeft(response.questions[0].time);
            setHasSubmittedScore(false);
        } catch (error) {
            console.error("Failed to start game:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start the game. Please check the console for details.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswer = (option: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(option);

        if (option === currentQuestion.correctAnswer) {
            const points = getPoints(timeLeft, difficulty);
            setScore(s => s + points);
            toast({ title: 'Correct!', description: `+${points} points`, className: 'bg-green-500/20 border-green-500/50' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrect!', description: `The correct answer was: ${currentQuestion.correctAnswer}` });
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setTimeLeft(questions[nextIndex].time);
            setSelectedAnswer(null);
        } else {
            setGameState('finished');
        }
    };

    const submitScore = useCallback(async () => {
        if (!user || !firestore || hasSubmittedScore || score === 0) return;
        setHasSubmittedScore(true);
        try {
          const scoresCollection = collection(firestore, 'games', `quiz-royale-solo-${category.replace(/\s/g, '')}`, 'scores');
          await addDocumentNonBlocking(scoresCollection, {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userImage: user.photoURL,
            score: score,
            createdAt: serverTimestamp(),
          });
          toast({
            title: "Score Submitted!",
            description: `Your score of ${score} has been saved to the leaderboard.`,
          });
        } catch (error) {
          console.error("Error submitting score:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not submit your score." });
          setHasSubmittedScore(false);
        }
    }, [user, firestore, score, hasSubmittedScore, category]);
    
    const resetGame = () => {
        setGameState('setup');
        setQuestions([]);
        setScore(0);
    }

    if (gameState === 'setup') {
        return (
            <AuthWrapper>
                <div className="container mx-auto py-12">
                    <Card className="max-w-lg mx-auto">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl flex items-center justify-center gap-2"><BrainCircuit /> AI Quiz</CardTitle>
                            <CardDescription>Configure your solo trivia challenge.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="font-medium">Difficulty</label>
                                 <Select value={difficulty} onValueChange={(v: Difficulty) => setDifficulty(v)}>
                                    <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={startGame} disabled={isLoading} className="w-full" size="lg">
                                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PartyPopper className="w-5 h-5 mr-2" />}
                                Start Game
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AuthWrapper>
        )
    }
    
    if (gameState === 'finished') {
        return (
             <AuthWrapper>
                <div className="container mx-auto py-12">
                     <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="text-4xl">Game Over!</CardTitle>
                                    <CardDescription>Here's how you did:</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="text-6xl font-bold text-primary">{score}</div>
                                     <p className="text-muted-foreground">Final Score</p>
                                     <div className="flex gap-4 justify-center">
                                        <Button onClick={resetGame} size="lg">Play Again</Button>
                                        {user && (
                                             <Button onClick={submitScore} size="lg" variant="outline" disabled={hasSubmittedScore || score === 0}>
                                                <Trophy className="w-4 h-4 mr-2" />
                                                {hasSubmittedScore ? "Score Submitted!" : "Submit Score"}
                                            </Button>
                                        )}
                                     </div>
                                </CardContent>
                            </Card>
                        </div>
                         <div className="md:col-span-1">
                            <Leaderboard gameId={`quiz-royale-solo-${category.replace(/\s/g, '')}`} />
                        </div>
                    </div>
                </div>
            </AuthWrapper>
        )
    }

    return (
        <AuthWrapper>
            <div className="container mx-auto py-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Question {currentQuestionIndex + 1}/{questions.length}</CardTitle>
                            <div className="text-lg font-bold text-primary">{score} pts</div>
                        </div>
                        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full" />
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 mb-6 text-center border rounded-lg bg-muted">
                            <p className="text-lg font-semibold">{currentQuestion.question}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {currentQuestion.options.map(option => {
                                const isCorrect = option === currentQuestion.correctAnswer;
                                const isSelected = option === selectedAnswer;
                                
                                return (
                                <Button 
                                    key={option} 
                                    onClick={() => handleAnswer(option)}
                                    disabled={!!selectedAnswer}
                                    variant="outline"
                                    className={cn("h-auto py-4 text-base whitespace-normal justify-start",
                                        selectedAnswer && isCorrect && "bg-green-500/20 border-green-500 hover:bg-green-500/30",
                                        selectedAnswer && isSelected && !isCorrect && "bg-red-500/20 border-red-500 hover:bg-red-500/30"
                                    )}
                                >
                                    {selectedAnswer && isCorrect && <CheckCircle className="w-5 h-5 mr-3 text-green-500"/>}
                                    {selectedAnswer && isSelected && !isCorrect && <XCircle className="w-5 h-5 mr-3 text-red-500"/>}
                                    {option}
                                </Button>
                            )})}
                        </div>
                        
                        <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2 text-lg font-semibold text-destructive">
                                <Timer />
                                {timeLeft}s
                            </div>
                            {selectedAnswer && (
                                <Button onClick={handleNextQuestion}>
                                    {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next Question"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    )
}
