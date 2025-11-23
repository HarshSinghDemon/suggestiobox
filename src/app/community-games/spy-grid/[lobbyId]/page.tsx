
'use client';

import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Crown, Hourglass, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SpyGridLobby } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function LobbySkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="w-32 h-6" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="w-full h-10" />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <Skeleton className="w-16 h-16 rounded-full" />
                                <Skeleton className="w-20 h-4" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};


export default function SpyGridLobbyPage({ params }: { params: { lobbyId: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const lobbyRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'spyGridLobbies', params.lobbyId);
    }, [firestore, params.lobbyId]);

    const { data: lobby, isLoading } = useDoc<SpyGridLobby>(lobbyRef);

    if (isLoading) {
        return (
            <AuthWrapper>
                <div className="container py-8 mx-auto">
                    <LobbySkeleton />
                </div>
            </AuthWrapper>
        );
    }

    if (!lobby) {
        return (
            <AuthWrapper>
                 <div className="container py-8 mx-auto text-center">
                    <h1 className="text-2xl font-bold">Lobby Not Found</h1>
                    <p className="text-muted-foreground">The game lobby you are looking for does not exist or has been closed.</p>
                    <Button onClick={() => router.push('/community-games/spy-grid')} className="mt-4">
                        Back to Game Hub
                    </Button>
                </div>
            </AuthWrapper>
        );
    }
    
    const isHost = user?.uid === lobby.hostId;
    const canStart = lobby.players.length >= 4;

    return (
        <AuthWrapper>
            <div className="container py-8 mx-auto">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl">Spy Grid</CardTitle>
                            <CardDescription>Share this code with friends to join. (Min 4 players to start)</CardDescription>
                            <div className="flex items-center justify-center pt-4">
                                <div className="px-6 py-3 font-mono text-3xl font-bold tracking-widest border-2 border-dashed rounded-lg border-primary text-primary bg-primary/10">
                                    {lobby.joinCode}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-col items-center justify-center p-6 my-6 text-center rounded-lg bg-muted">
                                <Hourglass className="w-10 h-10 mb-2 text-primary" />
                                <h3 className="text-lg font-semibold">Waiting for players...</h3>
                                <p className="text-sm text-muted-foreground">The host will start the game once everyone is in.</p>
                            </div>
                            
                            <div>
                                <h3 className="mb-4 text-xl font-semibold text-center">Players ({lobby.players.length} / 10)</h3>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                                    {lobby.players.map(player => (
                                        <div key={player.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-background">
                                            <div className="relative">
                                                <Avatar className="w-16 h-16">
                                                    <AvatarImage src={player.photoURL ?? undefined} />
                                                    <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                                                </Avatar>
                                                {player.id === lobby.hostId && (
                                                    <Badge className="absolute -top-1 -right-1">
                                                        <Crown className="w-3 h-3" />
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-center truncate">{player.displayName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {isHost && (
                                <div className="flex justify-center mt-8">
                                    <Button size="lg" disabled={!canStart}>
                                        <PartyPopper className="w-5 h-5 mr-2" />
                                        Start Game
                                    </Button>
                                </div>
                            )}
                             {!isHost && <p className="mt-8 text-sm text-center text-muted-foreground">Waiting for the host to start the game...</p>}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthWrapper>
    )
}
