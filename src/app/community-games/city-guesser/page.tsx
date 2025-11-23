'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BrainCircuit, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { cityGuesser, type CityGuesserInput, type CityGuesserOutput } from '@/ai/flows/city-guesser-flow';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Leaderboard } from '@/components/game/leaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const difficultySettings: Record<Difficulty, { multiplier: number }> = {
    'Easy': { multiplier: 1 },
    'Medium': { multiplier: 2 },
    'Hard': { multiplier: 3 },
};

function GameSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <h3 className="text-lg font-semibold">Generating new question...</h3>
                </div>
                <div className="p-4 space-y-2 border rounded-md">
                    <div className="w-3/4 h-5 bg-muted animate-pulse" />
                    <div className="w-full h-5 bg-muted animate-pulse" />
                </div>
                 <div className="p-4 space-y-2 border rounded-md">
                    <div className="w-1/2 h-5 bg-muted animate-pulse" />
                    <div className="w-5/6 h-5 bg-muted animate-pulse" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="w-full h-12 bg-muted animate-pulse rounded-md" />
                <div className="w-full h-12 bg-muted animate-pulse rounded-md" />
                <div className="w-full h-12 bg-muted animate-pulse rounded-md" />
                <div className="w-full h-12 bg-muted animate-pulse rounded-md" />
            </div>
        </div>
    );
}


export default function CityGuesserPage() {
    const [question, setQuestion] = useState<CityGuesserOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const fetchNewQuestion = useCallback(async () => {
        setIsLoading(true);
        setIsAnswered(false);
        setSelectedOption(null);
        setQuestion(null);
        try {
            const input: CityGuesserInput = { difficulty };
            const newQuestion = await cityGuesser(input);
            setQuestion(newQuestion);
        } catch (error) {
            console.error("Failed to fetch new question:", error);
            toast({
                variant: 'destructive',
                title: 'AI Error',
                description: 'Could not generate a new question. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, difficulty]);
    
    const submitScore = useCallback(async () => {
        if (!user || !firestore || score === 0 || hasSubmitted) return;
        setHasSubmitted(true);
        try {
          const scoresCollection = collection(firestore, 'games', 'city-guesser', 'scores');
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
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not submit your score.",
          });
          setHasSubmitted(false); // Allow retry
        }
    }, [user, firestore, score, toast, hasSubmitted]);


    useEffect(() => {
        fetchNewQuestion();
    }, [fetchNewQuestion]);

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);
        setHasSubmitted(false); // Reset submission status on new answer

        if (option === question?.city) {
            const difficultyMultiplier = difficultySettings[difficulty].multiplier;
            const points = (10 + streak * 2) * difficultyMultiplier;
            setScore(prev => prev + points);
            setStreak(prev => prev + 1);
            toast({
                title: 'Correct!',
                description: `+${points} points! The answer was indeed ${question.city}.`,
                className: 'bg-green-500/20 border-green-500/50',
            });
        } else {
            setStreak(0);
            toast({
                variant: 'destructive',
                title: 'Incorrect!',
                description: `The correct answer was ${question?.city}.`,
            });
        }
    };

    const getButtonVariant = (option: string) => {
        if (!isAnswered) return 'outline';
        if (option === question?.city) return 'default';
        if (option === selectedOption && option !== question?.city) return 'destructive';
        return 'outline';
    };

    return (
        <AuthWrapper>
            <div className="container py-8 mx-auto">
                 <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card className="w-full">
                            <CardHeader>
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <CardTitle className="flex items-center gap-2 text-2xl">
                                        <BrainCircuit className="w-8 h-8 text-primary"/>
                                        AI City Guesser
                                    </CardTitle>
                                     <div className="text-right">
                                        <p className="text-sm font-medium text-muted-foreground">Score</p>
                                        <p className="text-2xl font-bold text-primary">{score}</p>
                                    </div>
                                </div>
                                <CardDescription>Guess the city based on the hints provided by our AI.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <GameSkeleton />
                                ) : question ? (
                                    <div className="space-y-6">
                                        <div className="p-4 space-y-4 rounded-lg bg-muted">
                                            <div>
                                                <h3 className="font-semibold">Hint 1</h3>
                                                <p className="text-muted-foreground">{question.hint1}</p>
                                            </div>
                                            <div className="pt-4 border-t">
                                                <h3 className="font-semibold">Hint 2</h3>
                                                <p className="text-muted-foreground">{question.hint2}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {question.options.map(option => (
                                                <Button
                                                    key={option}
                                                    variant={getButtonVariant(option)}
                                                    className={cn("h-14 text-base justify-start p-4", {
                                                        'bg-green-500/20 border-green-500 hover:bg-green-500/30': isAnswered && option === question.city,
                                                        'bg-red-500/20 border-red-500 hover:bg-red-500/30': isAnswered && option === selectedOption && option !== question.city
                                                    })}
                                                    onClick={() => handleAnswer(option)}
                                                    disabled={isAnswered}
                                                >
                                                    {isAnswered && option === question.city && <CheckCircle className="w-5 h-5 mr-3 text-green-500"/>}
                                                    {isAnswered && option === selectedOption && option !== question.city && <XCircle className="w-5 h-5 mr-3 text-red-500"/>}
                                                    {option}
                                                </Button>
                                            ))}
                                        </div>

                                        {isAnswered && (
                                            <div className="pt-4 text-center">
                                                <Button onClick={fetchNewQuestion} size="lg">
                                                    Next Question
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        Could not load a question. Please try again.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Difficulty</label>
                            <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)} disabled={isLoading || isAnswered}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {user && (
                            <Button onClick={submitScore} disabled={hasSubmitted || score === 0} className="w-full">
                                <Trophy className="w-4 h-4 mr-2"/>
                                {hasSubmitted ? "Score Submitted!" : "Submit Score"}
                            </Button>
                        )}
                        <Leaderboard gameId="city-guesser" />
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}
