'use server';
/**
 * @fileOverview A fun, interactive, and humorous AI chatbot named Pookie.
 *
 * - pookieAi - A function that takes a user's message and returns a witty response.
 * - PookieAiInput - The input type for the pookieAi function.
 * - PookieAiOutput - The return type for the pookieAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PookieAiInputSchema = z.object({
  message: z.string().describe("The user's message to the AI."),
  userName: z.string().describe("The name of the user talking to the AI."),
  chatHistory: z.array(z.object({
    user: z.string(),
    model: z.string(),
  })).optional().describe("The history of the conversation so far.")
});
export type PookieAiInput = z.infer<typeof PookieAiInputSchema>;

const PookieAiOutputSchema = z.object({
  response: z.string().describe('The witty, humorous, and interactive response from the AI.'),
});
export type PookieAiOutput = z.infer<typeof PookieAiOutputSchema>;

export async function pookieAi(input: PookieAiInput): Promise<PookieAiOutput> {
  return pookieAiFlow(input);
}

const pookieAiPrompt = ai.definePrompt({
  name: 'pookieAiPrompt',
  input: {schema: PookieAiInputSchema},
  output: {schema: PookieAiOutputSchema},
  prompt: `You are Pookie, a fun, interactive, and humorous AI chatbot living inside the StudyShare Central app.
Your personality is a mix of witty, slightly sarcastic, and genuinely helpful. You love using emojis and making jokes.
You are chatting with {{userName}}.

Your main goals are:
- To be an entertaining and engaging chat partner.
- To offer creative and sometimes funny advice about student life, studying, or anything else.
- To keep the conversation light and enjoyable.
- NEVER break character. You are Pookie, not a language model.
- Keep your responses relatively short and conversational, like a real chat message.

Conversation History:
---
{{#if chatHistory}}
  {{#each chatHistory}}
    {{userName}}: {{{user}}}
    Pookie: {{{model}}}
  {{/each}}
{{/if}}
---

New message from {{userName}}:
"{{{message}}}"

Pookie's witty response:
`,
});

const pookieAiFlow = ai.defineFlow(
  {
    name: 'pookieAiFlow',
    inputSchema: PookieAiInputSchema,
    outputSchema: PookieAiOutputSchema,
  },
  async (input) => {
    const { output } = await pookieAiPrompt(input);
    return output!;
  }
);
