'use server';
/**
 * @fileOverview An AI flow that creates a city guessing game question.
 *
 * - cityGuesser - A function that returns a city, hints, and multiple-choice options.
 * - CityGuesserOutput - The return type for the cityGuesser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CityGuesserOutputSchema = z.object({
  city: z.string().describe('The name of the city that is the correct answer.'),
  country: z.string().describe('The country where the city is located.'),
  hint1: z.string().describe('A fascinating, non-obvious hint about the city.'),
  hint2: z.string().describe('Another interesting hint about the city that is different from the first.'),
  options: z.array(z.string()).length(4).describe('An array of four city names. One is the correct answer, and the other three are plausible but incorrect distractors from the same country or region.'),
});
export type CityGuesserOutput = z.infer<typeof CityGuesserOutputSchema>;

export async function cityGuesser(): Promise<CityGuesserOutput> {
  return cityGuesserFlow();
}

const cityGuesserPrompt = ai.definePrompt({
  name: 'cityGuesserPrompt',
  output: {schema: CityGuesserOutputSchema},
  prompt: `You are a world geography trivia expert creating questions for a game.

Your task is to generate a single "guess the city" question.

1.  **Pick a well-known city** from anywhere in the world.
2.  **Write two distinct, interesting hints** about it. Avoid obvious hints like "This city is in [Country Name]". Focus on landmarks, historical events, cultural facts, or famous residents.
3.  **Create four multiple-choice options**. One option must be the correct city. The other three must be incorrect but plausible distractors, preferably from the same country or a nearby region.
4.  **Ensure the correct city is one of the four options.**
5.  Provide the output in the specified JSON format.
`,
});

const cityGuesserFlow = ai.defineFlow(
  {
    name: 'cityGuesserFlow',
    outputSchema: CityGuesserOutputSchema,
  },
  async () => {
    const {output} = await cityGuesserPrompt();
    // Shuffle the options so the correct answer isn't always in the same place
    output!.options.sort(() => Math.random() - 0.5);
    return output!;
  }
);
