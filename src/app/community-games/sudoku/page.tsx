'use client';

import { SudokuGame } from '@/components/game/sudoku';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function SudokuPage() {
  return (
    <AuthWrapper>
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
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
    </AuthWrapper>
  );
}
