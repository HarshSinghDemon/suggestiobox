
'use client';

import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, arrayUnion, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { Eye, Loader2, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function SpyfallPage() {
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
                    }
                ],
            };
            const docRef = await addDoc(collection(firestore, 'spyfallLobbies'), lobbyData);
            router.push(`/community-games/spyfall/${docRef.id}`);
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
            const q = query(collection(firestore, 'spyfallLobbies'), where('joinCode', '==', joinCode.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Lobby not found', description: 'No game lobby was found with that code.' });
                setIsJoining(false);
                return;
            }

            const lobbyDoc = querySnapshot.docs[0];
            const lobbyId = lobbyDoc.id;
            const lobbyData = lobbyDoc.data();
            
            if (lobbyData.status !== 'waiting') {
                toast({ variant: 'destructive', title: 'Game in Progress', description: 'This game has already started or is finished.' });
                setIsJoining(false);
                return;
            }

            const playerExists = lobbyData.players.some((p: any) => p.id === user.uid);

            if (!playerExists) {
                if (lobbyData.players.length >= 8) { // Max 8 players
                    toast({ variant: 'destructive', title: 'Lobby Full', description: 'This game lobby is already full.' });
                    setIsJoining(false);
                    return;
                }
                await updateDoc(lobbyDoc.ref, {
                    players: arrayUnion({
                        id: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                    })
                });
            }
            
            router.push(`/community-games/spyfall/${lobbyId}`);

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
                    <Eye className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h1 className="text-4xl font-bold">Spyfall</h1>
                    <p className="mt-2 text-lg text-muted-foreground">A game of asking clever questions and giving clever answers.</p>
                </div>

                 <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 max-w-4xl mx-auto">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Play Solo vs. AI</CardTitle>
                            <CardDescription>Test your bluffing skills against a table of AI players.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full">
                                <BrainCircuit className="w-4 h-4 mr-2" />
                                Coming Soon
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Host a Game</CardTitle>
                            <CardDescription>Start a new game and invite your friends.</CardDescription>
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
                            <CardDescription>Enter the 6-digit code to join an existing lobby.</CardDescription>
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
