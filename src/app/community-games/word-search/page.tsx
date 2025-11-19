'use client';

import { WordSearchGame } from '@/components/game/word-search';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WordSearchPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
            <CardHeader className='text-center'>
                <CardTitle>Word Search</CardTitle>
                <CardDescription>Find all the hidden words in the grid. Click and drag to select.</CardDescription>
            </CardHeader>
            <CardContent>
                <WordSearchGame />
            </CardContent>
        </Card>
    </div>
  );
}
