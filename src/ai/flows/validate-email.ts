'use server';
/**
 * @fileOverview This flow validates an email address to check if it belongs to a temporary/disposable email service.
 *
 * - validateEmail - A function that checks if an email is from a disposable service.
 * - ValidateEmailInput - The input type for the validateEmail function.
 * - ValidateEmailOutput - The return type for the validateEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateEmailInputSchema = z.object({
  email: z.string().email().describe('The email address to validate.'),
});
export type ValidateEmailInput = z.infer<typeof ValidateEmailInputSchema>;

const ValidateEmailOutputSchema = z.object({
  isTemporary: z
    .boolean()
    .describe(
      'Whether the email address is from a known temporary or disposable email service.'
    )
    .default(false),
  reason: z
    .string()
    .optional()
    .describe(
      'The reason for flagging the email, e.g., "Domain is a known disposable email provider."'
    ),
});
export type ValidateEmailOutput = z.infer<typeof ValidateEmailOutputSchema>;

export async function validateEmail(
  input: ValidateEmailInput
): Promise<ValidateEmailOutput> {
  return validateEmailFlow(input);
}

const validateEmailPrompt = ai.definePrompt({
  name: 'validateEmailPrompt',
  input: {schema: ValidateEmailInputSchema},
  output: {schema: ValidateEmailOutputSchema},
  prompt: `You are an expert security tool that identifies temporary, disposable, or throwaway email addresses.

You will be given an email address. Your task is to determine if the domain of the email address belongs to a known disposable email provider.

Analyze the domain of the following email: {{{email}}}

If the domain is a disposable email provider (e.g., mailinator.com, temp-mail.org, 10minutemail.com), set isTemporary to true and provide a brief reason.
If it is a standard email provider (like gmail.com, outlook.com, yahoo.com) or a corporate/educational domain, set isTemporary to false.`,
});

const validateEmailFlow = ai.defineFlow(
  {
    name: 'validateEmailFlow',
    inputSchema: ValidateEmailInputSchema,
    outputSchema: ValidateEmailOutputSchema,
  },
  async input => {
    const {output} = await validateEmailPrompt(input);
    return output!;
  }
);
