'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseForAdmin } from '@/lib/firebase/admin-init';
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
});

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;


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

export async function uploadSuggestion(
  prevState: SuggestionFormState,
  formData: FormData
): Promise<SuggestionFormState> {
  const app = await initializeFirebaseForAdmin();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

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

  const file = formData.get('file') as File;
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
  if ((!file || file.size === 0) && (!description || description.trim() === '')) {
      errors.description = ['A description is required when no file is uploaded.'];
  }

  if (file && file.size > 0) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.file = [`Invalid file type. Only JPG, PNG, and PDF are allowed.`];
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.file = [`File is too large (max ${MAX_FILE_SIZE_MB}MB).`];
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return { message: 'Validation Error', errors, success: false };
  }


  // AI check for offensive language
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
  
  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let fileType: string | undefined;

  try {
    if (file && file.size > 0) {
      const bucket = storage.bucket();
      const filePath = `suggestions/${user.uid}/${Date.now()}-${file.name}`;
      const fileUpload = bucket.file(filePath);
      const buffer = Buffer.from(await file.arrayBuffer());
      
      await fileUpload.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Make the file publicly readable
      await fileUpload.makePublic();
      fileUrl = fileUpload.publicUrl();
      fileName = file.name;
      fileType = file.type;
    }

    await firestore.collection('suggestions').add({
      title,
      description: description || '',
      subject,
      fileUrl,
      fileName,
      fileType,
      createdAt: new Date(),
      userId: user.uid,
      userName: user.displayName,
      userImage: user.photoURL,
    });
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
  };
  
  export async function uploadAssignment(
    prevState: AssignmentFormState,
    formData: FormData
  ): Promise<AssignmentFormState> {
    const app = await initializeFirebaseForAdmin();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);

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
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { message: 'Invalid file type. Only JPG, PNG, and PDF are allowed.', errors: { file: ['Please upload a valid file type (JPG, PNG, PDF).'] }, success: false };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { message: `File is too large (max ${MAX_FILE_SIZE_MB}MB).`, errors: { file: [`File must be ${MAX_FILE_SIZE_MB}MB or less.`] }, success: false };
    }

    const { description, subject } = validatedFields.data;

    try {
      const bucket = storage.bucket();
      const filePath = `assignments/${user.uid}/${Date.now()}-${file.name}`;
      const fileUpload = bucket.file(filePath);
      const buffer = Buffer.from(await file.arrayBuffer());

      await fileUpload.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      await fileUpload.makePublic();
      const fileUrl = fileUpload.publicUrl();
  
      await firestore.collection('assignments').add({
        description,
        subject,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        createdAt: new Date(),
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
      });
    } catch (e: any) {
      console.error("Error during upload:", e);
      return { message: `Database Error: ${e.message}`, errors: {}, success: false };
    }
  
    revalidatePath('/browse');
    revalidatePath('/');
    return { message: 'Assignment uploaded successfully!', success: true };
  }
