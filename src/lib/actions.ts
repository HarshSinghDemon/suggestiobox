'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { SUBJECTS, ASSIGNMENT_SUBJECTS } from './constants';
import { checkSuggestionForOffensiveLanguage } from '@/ai/flows/check-suggestion-for-offensive-language';

// Helper to initialize Admin SDK safely
async function initializeAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }
  // In a managed environment like App Hosting, initializeApp() is sufficient.
  // We avoid using service accounts which aren't available and cause crashes.
  return initializeApp();
}


const suggestionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  subject: z.enum(SUBJECTS),
});

const assignmentSchema = z.object({
    description: z.string().min(10, 'Description must be at least 10 characters'),
    subject: z.enum(ASSIGNMENT_SUBJECTS),
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
  uploadInfo?: {
    uploadPath: string;
    documentId: string;
    collection: 'suggestions';
  }
};

export async function uploadSuggestion(
  prevState: SuggestionFormState,
  formData: FormData
): Promise<SuggestionFormState> {
  let app;
  try {
    app = await initializeAdminApp();
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin:", error);
    return { message: 'Server Configuration Error: Could not initialize Firebase.', errors: {}, success: false };
  }

  const auth = getAuth(app!);
  const firestore = getFirestore(app!);

  const idToken = formData.get('idToken') as string;
  if (!idToken) {
    return { message: 'Authentication Error: Missing user token.', errors: {}, success: false };
  }

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    return { message: 'Authentication Error: Invalid user token.', errors: {}, success: false };
  }
  
  const user = await auth.getUser(decodedToken.uid);
  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const subject = formData.get('subject') as (typeof SUBJECTS)[number];


  // Manual validation
  const errors: SuggestionFormState['errors'] = {};
  if (!title || title.length < 5) {
    errors.title = ['Title must be at least 5 characters long.'];
  }
  if (!subject || !SUBJECTS.includes(subject)) {
    errors.subject = ['Please select a valid subject.'];
  }
  if (!file?.size && (!description || description.trim() === '')) {
      errors.description = ['A description is required when no file is uploaded.'];
  }
  if(file && file.size > 10 * 1024 * 1024){ // 10MB limit
    errors.file = ['File size must be less than 10MB.'];
  }
  
  if (Object.keys(errors).length > 0) {
    return { message: 'Validation Error', errors, success: false };
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
  
  try {
    const docData = {
      title,
      description: description || '',
      subject,
      createdAt: new Date(),
      userId: user.uid,
      userName: user.displayName,
      userImage: user.photoURL,
      fileUrl: '',
      fileName: file?.name || '',
      fileType: file?.type || '',
    };

    const docRef = await firestore.collection('suggestions').add(docData);

    if (file && file.size > 0) {
        const uploadPath = `suggestions/${user.uid}/${Date.now()}-${file.name}`;
        revalidatePath('/browse');
        revalidatePath('/');
        return {
            message: 'Suggestion created. Now uploading file...',
            success: true,
            uploadInfo: {
                uploadPath,
                documentId: docRef.id,
                collection: 'suggestions',
            }
        };
    }

  } catch (e: any) {
    console.error("Error during upload:", e);
    return { message: `Database Error: ${e.message}`, errors: {}, success: false };
  }

  revalidatePath('/browse');
  revalidatePath('/');
  return { message: 'Suggestion uploaded successfully!', success: true };
}


export type AssignmentFormState = {
    message: string;
    errors?: {
      description?: string[];
      subject?: string[];
      file?: string[];
    };
    success: boolean;
    uploadInfo?: {
      uploadPath: string;
      documentId: string;
      collection: 'assignments';
    }
  };
  
  export async function uploadAssignment(
    prevState: AssignmentFormState,
    formData: FormData
  ): Promise<AssignmentFormState> {
    let app;
    try {
        app = await initializeAdminApp();
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin:", error);
        return { message: 'Server Configuration Error: Could not initialize Firebase.', errors: {}, success: false };
    }
    const auth = getAuth(app!);
    const firestore = getFirestore(app!);

    const idToken = formData.get('idToken') as string;
    if (!idToken) {
      return { message: 'Authentication Error: Missing user token.', errors: {}, success: false };
    }
  
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return { message: 'Authentication Error: Invalid user token.', errors: {}, success: false };
    }
    
    const user = await auth.getUser(decodedToken.uid);
  
    const validatedFields = assignmentSchema.safeParse({
      description: formData.get('description'),
      subject: formData.get('subject'),
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
    
    const { description, subject } = validatedFields.data;

    try {
        const docData = {
            description,
            subject,
            createdAt: new Date(),
            userId: user.uid,
            userName: user.displayName,
            userImage: user.photoURL,
            fileUrl: '',
            fileName: file.name,
            fileType: file.type,
        };

        const docRef = await firestore.collection('assignments').add(docData);

        const uploadPath = `assignments/${user.uid}/${Date.now()}-${file.name}`;
        
        revalidatePath('/browse');
        revalidatePath('/');
        return {
            message: 'Assignment entry created. Now uploading file...',
            success: true,
            uploadInfo: {
                uploadPath,
                documentId: docRef.id,
                collection: 'assignments',
            }
        };
    } catch (e: any) {
      console.error("Error during upload:", e);
      return { message: `Database Error: ${e.message}`, errors: {}, success: false };
    }
  }
