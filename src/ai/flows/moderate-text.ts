'use server';
/**
 * @fileOverview A general-purpose text moderation flow.
 *
 * - moderateText - A function that checks input text for harmful content.
 * - ModerateTextInput - The input type for the moderateText function.
 * - ModerateTextOutput - The return type for the moderateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateTextInputSchema = z.object({
  text: z.string().describe('The text to be moderated.'),
});
export type ModerateTextInput = z.infer<typeof ModerateTextInputSchema>;

const ModerateTextOutputSchema = z.object({
  isHarmful: z
    .boolean()
    .describe('Whether the text contains harmful content.')
    .default(false),
  reason: z
    .string()
    .optional()
    .describe('The reason why the text was flagged as harmful.'),
});
export type ModerateTextOutput = z.infer<typeof ModerateTextOutputSchema>;

export async function moderateText(
  input: ModerateTextInput
): Promise<ModerateTextOutput> {
  return moderateTextFlow(input);
}

const moderationPrompt = ai.definePrompt({
  name: 'moderationPrompt',
  input: {schema: ModerateTextInputSchema},
  output: {schema: ModerateTextOutputSchema},
  prompt: `You are a content moderation expert. Your task is to determine if the following text contains any harmful, abusive, hateful, or inappropriate content, including but not limited to profanity, hate speech, religious abuse, or personal attacks, in any language (especially English, Hindi, and Bengali).

If the text is harmful, set isHarmful to true and provide a brief, generic reason like "This content violates our community guidelines." Do not repeat the harmful content in your reason.
If the text is clean, set isHarmful to false.

Text to analyze:
"{{{text}}}"`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const moderateTextFlow = ai.defineFlow(
  {
    name: 'moderateTextFlow',
    inputSchema: ModerateTextInputSchema,
    outputSchema: ModerateTextOutputSchema,
  },
  async input => {
    // If the input is empty or just whitespace, consider it safe.
    if (!input.text.trim()) {
      return {isHarmful: false};
    }
    try {
      const {output} = await moderationPrompt(input);
      return output!;
    } catch (e: any) {
      // If the model itself blocks the content due to safety settings, it will throw an error.
      // We can interpret this as the content being harmful.
      if (e.message.includes('blocked')) {
        return {
          isHarmful: true,
          reason: 'This content violates our community guidelines.',
        };
      }
      // For other errors, we can choose to either block or allow.
      // For safety, it's better to block.
      console.error('Moderation flow error:', e);
      return {
        isHarmful: true,
        reason: 'Could not process text for moderation.',
      };
    }
  }
);
