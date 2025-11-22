'use server';
/**
 * @fileOverview An AI flow that acts as a coding assistant.
 *
 * - codeBuddy - A function that takes code, language, and a user query and returns an AI-generated answer.
 * - CodeBuddyInput - The input type for the codeBuddy function.
 * - CodeBuddyOutput - The return type for the codeBuddy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeBuddyInputSchema = z.object({
  code: z.string().describe('The source code to be analyzed.'),
  language: z.string().describe('The programming language of the code (e.g., "python", "javascript").'),
  query: z.string().describe('The user\'s question or command (e.g., "Explain this code", "Find the bug", "Optimize this function").'),
});
export type CodeBuddyInput = z.infer<typeof CodeBuddyInputSchema>;

const CodeBuddyOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s query based on the provided code.'),
});
export type CodeBuddyOutput = z.infer<typeof CodeBuddyOutputSchema>;

export async function codeBuddy(
  input: CodeBuddyInput
): Promise<CodeBuddyOutput> {
  return codeBuddyFlow(input);
}

const codeBuddyPrompt = ai.definePrompt({
  name: 'codeBuddyPrompt',
  input: {schema: CodeBuddyInputSchema},
  output: {schema: CodeBuddyOutputSchema},
  prompt: `You are an expert programmer and friendly AI code assistant. Your task is to help a user understand, debug, or improve a piece of code.

You will be given a block of code, its programming language, and a user's query. Based on the user's query, perform the requested action.

Actions could include:
- Explaining what the code does.
- Identifying bugs or potential errors.
- Suggesting improvements or optimizations.
- Answering a specific question about the code's logic.
- Adding comments to the code.
- Generating a code snippet to solve a problem.

**IMPORTANT FORMATTING RULES:**
- Structure your response using Markdown.
- Use headings (#, ##), bullet points (* or -), and bold text (**) to make the information clear and readable.
- For code blocks in your explanation, use Markdown code fences with the correct language identifier (e.g., \`\`\`python).
- Be concise but thorough in your explanation.

Here is the code (language: {{{language}}}):
---
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
---

Here is the user's query:
"{{{query}}}"

Your expert response:
`,
});

const codeBuddyFlow = ai.defineFlow(
  {
    name: 'codeBuddyFlow',
    inputSchema: CodeBuddyInputSchema,
    outputSchema: CodeBuddyOutputSchema,
  },
  async input => {
    if (!input.code.trim()) {
        return { response: "The code editor is empty. I have nothing to analyze." };
    }
    if (!input.query.trim()) {
        return { response: "Please provide a question or instruction." };
    }
    const {output} = await codeBuddyPrompt(input);
    return output!;
  }
);
