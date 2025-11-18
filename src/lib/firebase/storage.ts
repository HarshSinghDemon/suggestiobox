'use client';

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase and get storage instance
const { firebaseApp } = initializeFirebase();
const storage = getStorage(firebaseApp);

/**
 * Uploads a file to Firebase Storage and provides progress updates.
 *
 * @param file The file to upload.
 * @param onProgress Callback function for upload progress.
 * @param onError Callback function for errors.
 * @param onComplete Callback function for successful completion.
 * @returns An object containing the upload task and the full path of the file.
 */
export const uploadFile = (
  file: File,
  onProgress: (progress: number) => void,
  onError: (error: Error) => void,
  onComplete: (downloadURL: string) => void
): { task: UploadTask; fullPath: string } => {
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const fullPath = `uploads/${fileId}-${file.name}`;
  const storageRef = ref(storage, fullPath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    (error) => {
      console.error('Upload failed:', error);
      onError(error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        onComplete(downloadURL);
      });
    }
  );

  return { task: uploadTask, fullPath };
};


/**
 * Deletes a file from Firebase Storage.
 * @param filePath The full path of the file to delete (e.g., 'uploads/file-name.jpg').
 */
export const deleteFileFromStorage = async (filePath: string) => {
    const fileRef = ref(storage, filePath);
    try {
        await deleteObject(fileRef);
    } catch (error) {
        console.error("Error deleting file from Firebase Storage:", error);
        // If the file doesn't exist, Firebase throws an error.
        // We can choose to ignore 'storage/object-not-found' if needed.
        if ((error as any).code === 'storage/object-not-found') {
            console.warn(`File not found at path: ${filePath}. It might have been already deleted.`);
            return; // Resolve successfully if file is already gone
        }
        throw error; // Re-throw other errors
    }
};
