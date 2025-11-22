'use server';
/**
 * @fileOverview An AI flow that acts as a study buddy.
 *
 * - studyBuddy - A function that takes content and a user query and returns an AI-generated answer.
 * - StudyBuddyInput - The input type for the studyBuddy function.
 * - StudyBuddyOutput - The return type for the studyBuddy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyBuddyInputSchema = z.object({
  content: z.string().describe('The academic content (e.g., notes, description) to be analyzed.'),
  query: z.string().describe('The user\'s question or command (e.g., "Summarize this", "Explain the concept of TCP").'),
  fileDataUri: z.string().optional().describe(
      "A file, such as a PDF, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type StudyBuddyInput = z.infer<typeof StudyBuddyInputSchema>;

const StudyBuddyOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s query based on the provided content.'),
});
export type StudyBuddyOutput = z.infer<typeof StudyBuddyOutputSchema>;

export async function studyBuddy(
  input: StudyBuddyInput
): Promise<StudyBuddyOutput> {
  return studyBuddyFlow(input);
}

const studyBuddyPrompt = ai.definePrompt({
  name: 'studyBuddyPrompt',
  input: {schema: StudyBuddyInputSchema},
  output: {schema: StudyBuddyOutputSchema},
  prompt: `You are an expert Study Buddy AI. Your task is to help a student understand the provided academic content.
You will be given a piece of text content, and optionally a file. The file (PDF, etc.) should be considered the primary source of information if it exists.
Based on the user's query, perform the requested action on the content.

Actions could include:
- Summarizing the text/file.
- Explaining a specific concept from the material.
- Generating practice questions.
- Simplifying complex parts.

Provide a clear, concise, and helpful response directly addressing the user's query.

Here is the text content:
---
{{{content}}}
---

{{#if fileDataUri}}
And here is the file content you should prioritize:
{{media url=fileDataUri}}
{{/if}}

Here is the user's query:
"{{{query}}}"

Your response:
`,
});

const studyBuddyFlow = ai.defineFlow(
  {
    name: 'studyBuddyFlow',
    inputSchema: StudyBuddyInputSchema,
    outputSchema: StudyBuddyOutputSchema,
  },
  async input => {
    if (!input.content.trim() && !input.fileDataUri) {
        return { response: "The provided content is empty. I have nothing to analyze." };
    }
    const {output} = await studyBuddyPrompt(input);
    return output!;
  }
);
