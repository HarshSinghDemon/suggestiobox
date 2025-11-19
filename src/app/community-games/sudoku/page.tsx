'use client';

import { SudokuGame } from '@/components/game/sudoku';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SudokuPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
            <CardHeader className='text-center'>
                <CardTitle>Sudoku</CardTitle>
                <CardDescription>Fill the grid so that every row, column, and 3x3 box contains the digits 1-9.</CardDescription>
            </CardHeader>
            <CardContent>
                <SudokuGame />
            </CardContent>
        </Card>
    </div>
  );
}
