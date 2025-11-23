
'use server';
/**
 * @fileOverview An AI flow that generates a set of quiz questions.
 *
 * - quizMaster - A function that returns a list of trivia questions.
 * - QuizMasterInput - The input type for the quizMaster function.
 * - QuizMasterOutput - The return type for the quizMaster function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuizQuestionSchema = z.object({
  question: z.string().describe('The trivia question.'),
  options: z.array(z.string()).length(4).describe('An array of four possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options array.'),
  time: z.number().describe('The time limit in seconds for this question (e.g., 10, 15, or 20).'),
});

const QuizMasterInputSchema = z.object({
  category: z.string().describe('The category or topic for the quiz questions (e.g., "General Knowledge", "Computer Science", "World History").'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the questions.'),
  count: z.number().int().min(5).max(20).default(10).describe('The number of questions to generate.'),
});
export type QuizMasterInput = z.infer<typeof QuizMasterInputSchema>;

const QuizMasterOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
});
export type QuizMasterOutput = z.infer<typeof QuizMasterOutputSchema>;

export async function quizMaster(input: QuizMasterInput): Promise<QuizMasterOutput> {
  return quizMasterFlow(input);
}

const quizMasterPrompt = ai.definePrompt({
  name: 'quizMasterPrompt',
  input: {schema: QuizMasterInputSchema},
  output: {schema: QuizMasterOutputSchema},
  prompt: `You are an expert Quiz Master. Your task is to generate a set of {{count}} challenging and engaging trivia questions for a game.

The questions must be from the category: **{{{category}}}**.
The difficulty of the questions should be: **{{{difficulty}}}**.

For each question, provide:
1.  A clear and concise question.
2.  Exactly four multiple-choice options.
3.  The single correct answer, which must be one of the four options.
4.  A time limit in seconds (10 for easy, 15 for medium, 20 for hard).

Ensure the questions are varied, interesting, and accurate. Do not repeat questions. Provide the output in the specified JSON format.
`,
});

const quizMasterFlow = ai.defineFlow(
  {
    name: 'quizMasterFlow',
    inputSchema: QuizMasterInputSchema,
    outputSchema: QuizMasterOutputSchema,
  },
  async (input) => {
    const {output} = await quizMasterPrompt(input);
    return output!;
  }
);
