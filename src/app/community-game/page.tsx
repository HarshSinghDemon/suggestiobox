import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Hand, X, Brain, HelpCircle, Hash } from 'lucide-react';
import Link from 'next/link';

const games = [
    {
        name: 'Rock, Paper, Scissors',
        description: 'The classic game of choices.',
        href: '/community-games/rock-paper-scissors',
        icon: Hand,
    },
    {
        name: 'Tic-Tac-Toe',
        description: 'Try to get three in a row.',
        href: '/community-games/tic-tac-toe',
        icon: X,
    },
    {
        name: 'Memory Match',
        description: 'Test your memory with this card game.',
        href: '/community-games/memory-match',
        icon: Brain,
    },
    {
        name: 'Number Guesser',
        description: 'Guess the secret number.',
        href: '/community-games/number-guesser',
        icon: Hash,
    },
    {
        name: 'Dev Trivia',
        description: 'How well do you know tech?',
        href: '/community-games/dev-trivia',
        icon: HelpCircle,
    },
];


export default function CommunityGamePage() {
  return (
    <div className="container py-12 mx-auto">
        <div className="max-w-3xl mx-auto text-center">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold">Community Games</h1>
            <p className="mt-2 text-lg text-muted-foreground">Take a break and play a game with the community!</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
                <Link href={game.href} key={game.name} className="block transition-transform duration-300 transform hover:-translate-y-1">
                    <Card className="flex flex-col h-full hover:shadow-xl hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <game.icon className="w-10 h-10 text-primary" />
                            <div>
                                <CardTitle>{game.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardDescription>{game.description}</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}
