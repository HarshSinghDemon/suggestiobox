
'use client';

import type { SpyfallLobby } from '@/lib/types';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Eye, User } from 'lucide-react';
import { Button } from '../ui/button';

export function SpyfallGame({ lobby }: { lobby: SpyfallLobby }) {
    const { user } = useUser();
    // In a real implementation, roles and location would come from the lobby document
    const myRole = user?.uid === lobby.hostId ? 'Spy' : 'Agent';
    const location = 'Hospital';

    return (
        <div className="container py-8 mx-auto">
            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Spyfall</CardTitle>
                        <CardDescription>Ask questions, find the spy!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 space-y-2 text-center rounded-lg bg-muted">
                            <div>
                                <h3 className="font-semibold text-muted-foreground">Your Role</h3>
                                <Badge className="mt-1 text-lg">{myRole}</Badge>
                            </div>
                             <div className="pt-2 border-t">
                                <h3 className="font-semibold text-muted-foreground">Location</h3>
                                <p className="text-xl font-bold text-primary">{myRole === 'Spy' ? '???' : location}</p>
                            </div>
                        </div>

                         <div>
                            <h3 className="mb-4 text-xl font-semibold text-center">Players</h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {lobby.players.map(player => (
                                    <div key={player.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-background">
                                        <User className="w-10 h-10" />
                                        <p className="text-sm font-medium text-center truncate">{player.displayName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 text-center border-t">
                            <h3 className="text-xl font-semibold">Timer and Voting coming soon!</h3>
                             <Button variant="outline" className="mt-4">End Game</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
