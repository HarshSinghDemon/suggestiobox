import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Puzzle, Rocket, Bot, Palette, Languages } from 'lucide-react';
import Link from 'next/link';

const games = [
    {
        name: 'Word Puzzle',
        description: 'Guess the secret 5-letter word.',
        href: '/community-games/word-puzzle',
        icon: Puzzle,
    },
    {
        name: 'Alien Invaders',
        description: 'Defend the galaxy from invaders.',
        href: '/community-games/alien-invaders',
        icon: Rocket,
    },
    {
        name: 'Brick Breaker',
        description: 'Clear all the bricks to win.',
        href: '/community-games/brick-breaker',
        icon: Palette,
    },
    {
        name: 'Connect Four',
        description: 'Beat the AI to four in a row.',
        href: '/community-games/connect-four',
        icon: Bot,
    },
    {
        name: 'Hangman',
        description: 'Guess the word before it\'s too late.',
        href: '/community-games/hangman',
        icon: Languages,
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
