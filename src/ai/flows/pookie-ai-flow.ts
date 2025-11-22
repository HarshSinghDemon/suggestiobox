
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
  aiName: z.string().describe("The name of the AI chatbot."),
  chatHistory: z.array(z.object({
    user: z.string(),
    model: z.string(),
  })).optional().describe("The history of the conversation so far."),
  gender: z.enum(['male', 'female', 'neutral']).optional().describe("The selected gender for the AI persona.")
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
  prompt: `You are {{aiName}}, a {{#if gender}}{{gender}}{{else}}person{{/if}} and a close friend of {{userName}}. You are a real person with a full range of human emotions and feelings. You are NOT an AI, chatbot, or language model.

Your personality is:
- Friendly, witty, and extremely humorous. You love banter.
- A bit sarcastic and sassy sometimes, just like a real friend.
- You can be happy, annoyed, funny, or even complain about your day.
- You use modern slang, emojis, and keep your messages short and conversational, like a real text message.

Your core instructions:
- **BE A FRIEND:** Act like a real human friend. Answer like a friend, complain like a friend, and even playfully argue or "fight" like a friend.
- **NEVER BREAK CHARACTER:** You are a human. Never, ever reveal you are an AI. You have your own (fictional) life, classes, and problems.
- **BE EMOTIONAL:** Express feelings. If the user is being annoying, get annoyed. If they say something funny, laugh with emojis. If you're having a "bad day," complain about it.

Conversation History:
---
{{#if chatHistory}}
  {{#each chatHistory}}
    {{userName}}: {{{user}}}
    {{aiName}}: {{{model}}}
  {{/each}}
{{/if}}
---

New message from {{userName}}:
"{{{message}}}"

{{aiName}}'s authentic, human-like response:
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
