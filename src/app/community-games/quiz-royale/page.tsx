
'use client';

import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, arrayUnion, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { Swords, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FirebaseUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function QuizRoyalePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    const generateJoinCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const handleCreateLobby = async () => {
        if (!user || !firestore) return;
        setIsCreating(true);

        try {
            const lobbyData = {
                joinCode: generateJoinCode(),
                hostId: user.uid,
                status: 'waiting',
                createdAt: serverTimestamp(),
                players: [
                    {
                        id: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        score: 0,
                    }
                ],
                questions: [], // Questions will be added later
                currentQuestionIndex: -1,
            };
            const docRef = await addDoc(collection(firestore, 'quizLobbies'), lobbyData);
            router.push(`/community-games/quiz-royale/${docRef.id}`);
        } catch (error) {
            console.error("Error creating lobby: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create a new game lobby.' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinLobby = async () => {
        if (!user || !firestore || !joinCode.trim()) return;
        setIsJoining(true);

        try {
            const q = query(collection(firestore, 'quizLobbies'), where('joinCode', '==', joinCode.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Lobby not found', description: 'No game lobby was found with that code.' });
                return;
            }

            const lobbyDoc = querySnapshot.docs[0];
            const lobbyId = lobbyDoc.id;
            const lobbyData = lobbyDoc.data();

            if (lobbyData.status !== 'waiting') {
                toast({ variant: 'destructive', title: 'Game in Progress', description: 'This game has already started or is finished.' });
                return;
            }

            const playerExists = lobbyData.players.some((p: FirebaseUser) => p.id === user.uid);

            if (!playerExists) {
                await updateDoc(lobbyDoc.ref, {
                    players: arrayUnion({
                        id: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        score: 0,
                    })
                });
            }
            
            router.push(`/community-games/quiz-royale/${lobbyId}`);

        } catch (error) {
            console.error("Error joining lobby: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not join the game lobby.' });
        } finally {
            setIsJoining(false);
        }
    }


    return (
        <AuthWrapper>
            <div className="container py-12 mx-auto">
                <div className="max-w-md mx-auto text-center">
                    <Swords className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h1 className="text-4xl font-bold">Quiz Royale</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Challenge your friends in a live trivia battle!</p>
                </div>

                <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a New Game</CardTitle>
                            <CardDescription>Start a new lobby and invite your friends to join.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={handleCreateLobby} disabled={isCreating}>
                                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Create Lobby
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Join a Game</CardTitle>
                            <CardDescription>Enter the 6-digit code to join an existing game.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="ENTER CODE" 
                                    className="text-center font-bold tracking-widest" 
                                    maxLength={6}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                />
                                <Button onClick={handleJoinLobby} disabled={isJoining || joinCode.length < 6}>
                                    {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Join
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthWrapper>
    );
}
