
'use client';

import type { ImposterLobby } from '@/lib/types';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { User, Shield, Bomb } from 'lucide-react';

export function ImposterAgendaGame({ lobby }: { lobby: ImposterLobby }) {
    const { user } = useUser();
    const myRole = user ? lobby.roles[user.uid] : null;

    return (
        <div className="container py-8 mx-auto">
            <div className="max-w-4xl mx-auto">
                 <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Imposter's Agenda</CardTitle>
                        <CardDescription>The game is afoot!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 text-center rounded-lg bg-muted">
                            <h3 className="text-lg font-semibold">Your Role</h3>
                            {myRole === 'hero' && (
                                <Badge className="mt-2 text-lg bg-blue-500 hover:bg-blue-600">
                                    <Shield className="w-5 h-5 mr-2" />
                                    Hero
                                </Badge>
                            )}
                            {myRole === 'saboteur' && (
                                <Badge variant="destructive" className="mt-2 text-lg">
                                    <Bomb className="w-5 h-5 mr-2" />
                                    Saboteur
                                </Badge>
                            )}
                             {!myRole && <p>Observing...</p>}
                        </div>

                         <div>
                            <h3 className="mb-4 text-xl font-semibold text-center">Players</h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                                {lobby.players.map(player => (
                                    <div key={player.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-background">
                                        <User className="w-12 h-12" />
                                        <p className="text-sm font-medium text-center truncate">{player.displayName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pt-6 text-center border-t">
                            <h3 className="text-xl font-semibold">Crisis and Voting are coming soon!</h3>
                            <p className="text-muted-foreground">The next phase of gameplay is under construction.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
