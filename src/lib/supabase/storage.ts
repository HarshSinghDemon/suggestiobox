'use client';

import { supabase } from './client';

/**
 * Reusable function to upload a file to Supabase Storage directly from the client.
 *
 * @param file The file object to upload.
 * @returns An object containing the public URL and the path of the uploaded file.
 */
export async function uploadFileToSupabase(file: File) {
  const bucketName = 'uploads'; 

  // Sanitize the filename to be URL-friendly and unique.
  const fileExtension = file.name.split('.').pop();
  const sanitizedFileName = file.name
    .replace(`.${fileExtension}`, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${sanitizedFileName}-${Date.now()}.${fileExtension}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload failed. Raw error:', uploadError);
    if (uploadError instanceof Error && 'message' in uploadError && !uploadError.message.includes('{')) {
        console.error('Raw Server Response:', uploadError.message);
    }
    throw new Error(`Failed to upload file. Message: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(uploadData.path);

  if (!publicUrlData) {
    throw new Error('Could not get public URL for the uploaded file.');
  }

  return {
    url: publicUrlData.publicUrl,
    path: uploadData.path,
    name: file.name,
    type: file.type,
  };
}

export async function deleteFileFromStorage(filePath: string) {
    const bucketName = 'uploads';
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
        console.error('Failed to delete file from Supabase Storage:', error);
        throw new Error('Could not delete file from storage.');
    }
}
