
'use server';
/**
 * @fileOverview An AI flow that creates a city guessing game question.
 *
 * - cityGuesser - A function that returns a city, hints, and multiple-choice options.
 * - CityGuesserInput - The input type for the cityGuesser function.
 * - CityGuesserOutput - The return type for the cityGuesser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CityGuesserInputSchema = z.object({
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium').describe('The difficulty level of the question.'),
});
export type CityGuesserInput = z.infer<typeof CityGuesserInputSchema>;

const CityGuesserOutputSchema = z.object({
  city: z.string().describe('The name of the city that is the correct answer.'),
  country: z.string().describe('The country where the city is located.'),
  hint1: z.string().describe('A fascinating, non-obvious hint about the city.'),
  hint2: z.string().describe('Another interesting hint about the city that is different from the first.'),
  options: z.array(z.string()).length(4).describe('An array of four city names. One is the correct answer, and the other three are plausible but incorrect distractors from the same country or region.'),
});
export type CityGuesserOutput = z.infer<typeof CityGuesserOutputSchema>;

export async function cityGuesser(input: CityGuesserInput): Promise<CityGuesserOutput> {
  return cityGuesserFlow(input);
}

const cityGuesserPrompt = ai.definePrompt({
  name: 'cityGuesserPrompt',
  input: {schema: CityGuesserInputSchema},
  output: {schema: CityGuesserOutputSchema},
  prompt: `You are a world geography trivia expert creating a wide variety of questions for a game. It is crucial that you provide different cities and avoid repetition in your responses. Do not generate questions for cities you have provided before.

Your task is to generate a single "guess the city" question based on the chosen difficulty level: {{{difficulty}}}.

Difficulty & Region Guidelines:
- **Easy & Medium:** The city MUST be from India. You should vary your selections and not repeatedly choose the same few cities. Explore different states and regions within India.
- **Hard:** The city can be from anywhere in the world.

Difficulty Details:
- **Easy:** Pick a very well-known Indian Tier-1 or Tier-2 city (e.g., Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad). Hints should be about famous, unmissable landmarks or facts.
- **Medium:** Pick a well-known but perhaps not Tier-1 Indian city. Choose from a diverse range of state capitals or historically significant cities (e.g., Jaipur, Lucknow, Kochi, Bhopal, Patna, Varanasi). Hints can be about culture, industry, or secondary landmarks.
- **Hard:** Pick a notable but less globally famous city from anywhere in the world (e.g., Timbuktu, Petra, Samarkand, Cusco). Hints should be more obscure and challenging.

Instructions:
1.  **Pick a city** according to the difficulty and region rules. Ensure variety and do not repeat cities from previous requests.
2.  **Provide the city's country.**
3.  **Write two distinct, interesting hints** appropriate for the difficulty. Avoid obvious hints like "This city is in [Country Name]".
4.  **Create four multiple-choice options**. One option must be the correct city. The other three must be incorrect but plausible distractors from the same country or region.
5.  **Ensure the correct city is one of the four options.**
6.  Provide the output in the specified JSON format.
`,
});

const cityGuesserFlow = ai.defineFlow(
  {
    name: 'cityGuesserFlow',
    inputSchema: CityGuesserInputSchema,
    outputSchema: CityGuesserOutputSchema,
  },
  async (input) => {
    const {output} = await cityGuesserPrompt(input);
    // Shuffle the options so the correct answer isn't always in the same place
    output!.options.sort(() => Math.random() - 0.5);
    return output!;
  }
);
