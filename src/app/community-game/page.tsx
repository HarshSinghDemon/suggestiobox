'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Puzzle, Bot, Palette, Languages, BotIcon, Bomb, Hand, Brain, Bird, AlignEndVertical, Search, Columns } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const SnakeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 12H12.01"/><path d="M16 8H16.01"/><path d="M12 16H12.01"/><path d="M12 8H12.01"/><path d="M8 12H8.01"/><path d="M16 12H16.01"/><path d="M12 20H12.01"/><path d="M4 16H4.01"/><path d="M8 16H8.01"/><path d="M8 20H8.01"/><path d="M4 12H4.01"/><path d="M4 8H4.01"/><path d="M8 8H8.01"/><path d="M16 16H16.01"/><path d="M20 12H20.01"/><path d="M20 16H20.01"/></svg>
);

const TicTacToeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
);

const games = [
    {
        name: 'Brick Breaker',
        description: 'Clear all the bricks to win.',
        href: '/community-games/brick-breaker',
        icon: Palette,
        variant: 'ocean',
    },
    {
        name: 'Hangman',
        description: 'Guess the word before it\'s too late.',
        href: '/community-games/hangman',
        icon: Languages,
        variant: 'fiery',
    },
    {
        name: 'Snake',
        description: 'Guide the snake to eat the food.',
        href: '/community-games/snake',
        icon: SnakeIcon,
        variant: 'fiery',
    },
    {
        name: 'Minesweeper',
        description: 'Clear the board without hitting a mine.',
        href: '/community-games/minesweeper',
        icon: Bomb,
        variant: 'ocean',
    },
    {
        name: '2048',
        description: 'Slide tiles to get the 2048 tile.',
        href: '/community-games/2048',
        icon: Brain,
        variant: 'ocean',
    },
    {
        name: 'Rock Paper Scissors',
        description: 'Challenge the computer in a classic match.',
        href: '/community-games/rock-paper-scissors',
        icon: Hand,
        variant: 'fiery',
    },
    {
        name: 'Tic-Tac-Toe',
        description: 'Try to get three in a row against the AI.',
        href: '/community-games/tic-tac-toe',
        icon: TicTacToeIcon,
        variant: 'fiery',
    },
    {
        name: 'Flappy Bird',
        description: 'Flap your way through the pipes.',
        href: '/community-games/flappy-bird',
        icon: Bird,
        variant: 'ocean',
    },
    {
        name: 'Sudoku',
        description: 'Fill the grid with numbers 1-9.',
        href: '/community-games/sudoku',
        icon: Columns,
        variant: 'ocean',
    },
    {
        name: 'Word Search',
        description: 'Find the hidden words in the puzzle.',
        href: '/community-games/word-search',
        icon: Search,
        variant: 'fiery',
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
                <Link href={game.href} key={game.name} className="block transition-transform duration-300 transform hover:-translate-y-2">
                    <Card className={cn(
                      "flex flex-col h-full transition-shadow duration-300 hover:shadow-xl",
                      game.variant === 'default' && 'hover:border-primary/50',
                      game.variant === 'fiery' && 'bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-red-600/10 border-orange-500/30 hover:border-orange-400 hover:shadow-orange-500/20',
                      game.variant === 'ocean' && 'bg-gradient-to-br from-blue-400/10 via-violet-500/10 to-purple-600/10 border-blue-500/30 hover:border-blue-400 hover:shadow-blue-500/20'
                    )}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <game.icon className={cn("w-10 h-10", game.variant === 'fiery' ? 'text-orange-400' : game.variant === 'ocean' ? 'text-blue-400' : 'text-primary')} />
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
