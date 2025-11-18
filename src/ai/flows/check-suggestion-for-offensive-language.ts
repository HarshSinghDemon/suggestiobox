'use server';
/**
 * @fileOverview This flow checks a suggestion's title and description for offensive language.
 *
 * - checkSuggestionForOffensiveLanguage -  A function that checks the input suggestion for offensive language.
 * - CheckSuggestionForOffensiveLanguageInput - The input type for the checkSuggestionForOffensiveLanguage function.
 * - CheckSuggestionForOffensiveLanguageOutput - The return type for the checkSuggestionForOffensiveLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckSuggestionForOffensiveLanguageInputSchema = z.object({
  title: z.string().describe('The title of the suggestion.'),
  description: z.string().describe('The description of the suggestion.'),
});
export type CheckSuggestionForOffensiveLanguageInput = z.infer<
  typeof CheckSuggestionForOffensiveLanguageInputSchema
>;

const CheckSuggestionForOffensiveLanguageOutputSchema = z.object({
  isOffensive: z
    .boolean()
    .describe(
      'Whether the title or description contains offensive language. Defaults to false.'
    )
    .default(false),
  offensiveWords: z
    .array(z.string())
    .describe('A list of offensive words found in the title or description.')
    .default([]),
});
export type CheckSuggestionForOffensiveLanguageOutput = z.infer<
  typeof CheckSuggestionForOffensiveLanguageOutputSchema
>;

export async function checkSuggestionForOffensiveLanguage(
  input: CheckSuggestionForOffensiveLanguageInput
): Promise<CheckSuggestionForOffensiveLanguageOutput> {
  return checkSuggestionForOffensiveLanguageFlow(input);
}

const checkSuggestionPrompt = ai.definePrompt({
  name: 'checkSuggestionPrompt',
  input: {schema: CheckSuggestionForOffensiveLanguageInputSchema},
  output: {schema: CheckSuggestionForOffensiveLanguageOutputSchema},
  prompt: `You are a content moderation tool.

You will receive a title and a description for a suggestion.
Your task is to determine if the title or description contains any offensive language.
If it does, set isOffensive to true and list the offensive words in offensiveWords.
If it does not, set isOffensive to false and leave offensiveWords empty.

Title: {{{title}}}
Description: {{{description}}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const checkSuggestionForOffensiveLanguageFlow = ai.defineFlow(
  {
    name: 'checkSuggestionForOffensiveLanguageFlow',
    inputSchema: CheckSuggestionForOffensiveLanguageInputSchema,
    outputSchema: CheckSuggestionForOffensiveLanguageOutputSchema,
  },
  async input => {
    const {output} = await checkSuggestionPrompt(input);
    return output!;
  }
);
