
'use client';

import { WhacAMoleGame } from '@/components/game/whac-a-mole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Leaderboard } from '@/components/game/leaderboard';
import { useUser } from '@/firebase';

export default function WhacAMolePage() {
    const { user } = useUser();
  return (
    <AuthWrapper>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row">
        <div className="flex-grow p-4">
            <Card className="flex flex-col h-full">
                <CardHeader className="text-center">
                    <CardTitle>Whac-A-Mole</CardTitle>
                    <CardDescription>Click the moles as fast as you can before time runs out!</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <WhacAMoleGame />
                </CardContent>
            </Card>
        </div>
        <div className="w-full p-4 shrink-0 md:w-1/4">
            {user && <Leaderboard gameId="whac-a-mole" />}
        </div>
      </div>
    </AuthWrapper>
  );
}
