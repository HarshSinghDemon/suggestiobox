'use server';
/**
 * @fileOverview AI flows for the Spy Grid (Codenames) game.
 *
 * - generateSpyGridBoard: Creates a 5x5 grid of words based on a theme.
 * - generateSpyMasterClue: Generates a Spymaster clue for a given board state.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for a single word on the board, including its team assignment
const WordSchema = z.object({
    word: z.string(),
    team: z.enum(['red', 'blue', 'neutral', 'assassin']),
});

// Input for generating the game board
export const GenerateSpyGridBoardInputSchema = z.object({
  theme: z.string().default('General Knowledge').describe('The theme for the word grid (e.g., "Technology", "Fantasy", "Food").'),
});
export type GenerateSpyGridBoardInput = z.infer<typeof GenerateSpyGridBoardInputSchema>;

// Output for the game board
export const GenerateSpyGridBoardOutputSchema = z.object({
  words: z.array(WordSchema).length(25).describe('A 25-word array for a 5x5 grid, with team assignments.'),
});
export type GenerateSpyGridBoardOutput = z.infer<typeof GenerateSpyGridBoardOutputSchema>;


// Input for generating a Spymaster's clue
export const GenerateSpyMasterClueInputSchema = z.object({
    words: z.array(WordSchema).describe('The current state of the 5x5 game board.'),
    spymasterTeam: z.enum(['red', 'blue']).describe("The team for which the Spymaster is generating a clue."),
});
export type GenerateSpyMasterClueInput = z.infer<typeof GenerateSpyMasterClueInputSchema>;

// Output for the Spymaster's clue
export const GenerateSpyMasterClueOutputSchema = z.object({
  clue: z.string().describe("A single, clever word that connects multiple words for the Spymaster's team."),
  number: z.number().int().min(1).describe("The number of words on the board related to the clue."),
  reasoning: z.string().describe("A brief explanation of the Spymaster's thinking and which words the clue points to."),
  associatedWords: z.array(z.string()).describe("The list of words the clue is intended for."),
});
export type GenerateSpyMasterClueOutput = z.infer<typeof GenerateSpyMasterClueOutputSchema>;


// --- Flow Implementations ---

const generateBoardPrompt = ai.definePrompt({
    name: 'generateSpyGridBoardPrompt',
    input: { schema: GenerateSpyGridBoardInputSchema },
    output: { schema: GenerateSpyGridBoardOutputSchema },
    prompt: `You are a game designer creating a word grid for a game similar to Codenames.
The theme is: **{{{theme}}}**.

Generate a list of 25 unique, single words related to this theme. Do NOT repeat words.

Then, assign roles to these words based on these rules:
- 9 words must be assigned to the 'red' team.
- 8 words must be assigned to the 'blue' team.
- 7 words must be 'neutral'.
- 1 word must be the 'assassin'.

Shuffle the final list of 25 words so the roles are mixed randomly.
Provide the output in the specified JSON format.
`,
});

const generateCluePrompt = ai.definePrompt({
    name: 'generateSpyMasterCluePrompt',
    input: { schema: GenerateSpyMasterClueInputSchema },
    output: { schema: GenerateSpyMasterClueOutputSchema },
    prompt: `You are an expert Spymaster in a Codenames-like game called Spy Grid. Your goal is to give a one-word clue to help your teammates guess your team's words.

You are the Spymaster for the **{{spymasterTeam}}** team.

Here is the current game board state:
{{#each words}}
- {{word}} (Team: {{team}})
{{/each}}

Your task:
1.  Analyze the board and identify the remaining words for your team ({{spymasterTeam}}).
2.  Find a creative, single-word clue that connects 2 or more of your team's words.
3.  The clue must NOT be any word already on the board.
4.  State the number of words your clue relates to.
5.  Provide a brief reasoning for your clue and list the words it's intended for.

**CRITICAL:** Prioritize clues that connect multiple words. A clue for just one word is a last resort. Avoid giving clues that might lead your team to guess the assassin word.
`,
});


export async function generateSpyGridBoard(input: GenerateSpyGridBoardInput): Promise<GenerateSpyGridBoardOutput> {
    const { output } = await generateBoardPrompt(input);
    return output!;
}

export async function generateSpyMasterClue(input: GenerateSpyMasterClueInput): Promise<GenerateSpyMasterClueOutput> {
    const { output } = await generateCluePrompt(input);
    return output!;
}
