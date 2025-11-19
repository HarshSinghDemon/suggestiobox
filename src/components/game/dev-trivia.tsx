'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

const triviaQuestions = [
  {
    question: 'What does CSS stand for?',
    options: ['Cascading Style Sheets', 'Creative Style System', 'Computer Style Sheets', 'Colorful Style Sheets'],
    answer: 'Cascading Style Sheets',
  },
  {
    question: 'Which company developed TypeScript?',
    options: ['Google', 'Facebook', 'Microsoft', 'Apple'],
    answer: 'Microsoft',
  },
  {
    question: 'In JavaScript, which of these is NOT a primitive data type?',
    options: ['String', 'Number', 'Object', 'Boolean'],
    answer: 'Object',
  },
  {
    question: 'What is the purpose of the `git clone` command?',
    options: ['To create a new branch', 'To create a copy of a repository', 'To merge branches', 'To commit changes'],
    answer: 'To create a copy of a repository',
  },
   {
    question: 'Which hook is used to perform side effects in a React functional component?',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    answer: 'useEffect',
  },
];

export function DevTrivia() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = triviaQuestions[currentQuestionIndex];

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswer(option);
    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < triviaQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
      // Shuffle questions for a new game
      for (let i = triviaQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [triviaQuestions[i], triviaQuestions[j]] = [triviaQuestions[j], triviaQuestions[i]];
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsAnswered(false);
    setIsFinished(false);
  };
  
  const getButtonClass = (option: string) => {
    if (!isAnswered) return '';
    if (option === currentQuestion.answer) return 'bg-green-500 hover:bg-green-600 text-white';
    if (option === selectedAnswer) return 'bg-red-500 hover:bg-red-600 text-white';
    return '';
  };

  if (isFinished) {
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <p className="text-xl">Your final score is:</p>
            <p className="text-4xl font-bold text-primary">{score} / {triviaQuestions.length}</p>
            <Button onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
            </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
        <div className="w-full text-center">
            <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {triviaQuestions.length}</p>
            <h2 className="mt-2 text-xl font-semibold">{currentQuestion.question}</h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            {currentQuestion.options.map((option) => (
                <Button
                    key={option}
                    variant="outline"
                    className={cn('justify-start h-auto py-3 text-left whitespace-normal', getButtonClass(option))}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                >
                    {option}
                </Button>
            ))}
        </div>
        
        {isAnswered && (
            <Button onClick={handleNext} className="w-full">
                {currentQuestionIndex < triviaQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
        )}
    </div>
  );
}
