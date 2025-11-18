'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { SUBJECTS, ASSIGNMENT_SUBJECTS } from './constants';
import { checkSuggestionForOffensiveLanguage } from '@/ai/flows/check-suggestion-for-offensive-language';

const suggestionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  subject: z.enum(SUBJECTS),
  file: z.instanceof(File).optional(),
});

const assignmentSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  subject: z.enum(ASSIGNMENT_SUBJECTS),
  file: z.instanceof(File),
});

export type SuggestionFormState = {
  message: string;
  errors?: {
    title?: string[];
    description?: string[];
    subject?: string[];
    file?: string[];
    ai?: string;
  };
  success: boolean;
};

export async function validateSuggestion(
  formData: FormData
): Promise<SuggestionFormState> {
  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  const validatedFields = suggestionSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    subject: formData.get('subject'),
    file: file ?? undefined,
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation Error',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  if (!file?.size && (!description || description.trim() === '')) {
    return {
        message: 'Validation Error',
        errors: { description: ['A description is required when no file is uploaded.'] },
        success: false
    };
  }

  if(file && file.size > 10 * 1024 * 1024){ // 10MB limit
    return {
        message: 'Validation Error',
        errors: { file: ['File size must be less than 10MB.'] },
        success: false
    }
  }

  // AI check for offensive language
  try {
    const offensiveCheck = await checkSuggestionForOffensiveLanguage({ title, description: description || '' });
    if (offensiveCheck.isOffensive) {
        return {
            message: 'AI Moderation Error',
            errors: {
                ai: `Your submission contains potentially offensive language. Please revise. Detected words: ${offensiveCheck.offensiveWords.join(', ')}`
            },
            success: false
        };
    }
  } catch (aiError) {
    console.error("AI check failed:", aiError);
    // Non-blocking, proceed with submission if AI fails
  }

  revalidatePath('/browse');
  revalidatePath('/');
  return { message: 'Validation successful!', success: true, errors: {} };
}


export type AssignmentFormState = {
    message: string;
    errors?: {
      description?: string[];
      subject?: string[];
      file?: string[];
    };
    success: boolean;
};
  
export async function validateAssignment(
    formData: FormData
): Promise<AssignmentFormState> {
  
    const validatedFields = assignmentSchema.safeParse({
      description: formData.get('description'),
      subject: formData.get('subject'),
      file: formData.get('file'),
    });
  
    if (!validatedFields.success) {
      return {
        message: 'Validation Error',
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
        return { message: 'File is required for assignments.', errors: { file: ['Please select a file to upload.'] }, success: false };
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { message: 'File size must be less than 10MB.', errors: { file: ['File size must be less than 10MB.'] }, success: false };
    }
    
    revalidatePath('/browse');
    revalidatePath('/');
    return { message: 'Validation successful!', success: true, errors: {} };
}
