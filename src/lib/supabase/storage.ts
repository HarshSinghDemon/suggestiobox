'use client';

import { createSupabaseClient } from './client';

/**
 * Reusable function to upload a file to Supabase Storage.
 *
 * @param file The file object to upload.
 * @returns An object containing the public URL and the path of the uploaded file.
 */
export async function uploadFileToSupabase(file: File) {
  const supabase = createSupabaseClient();
  const bucketName = 'uploads';

  // Sanitize the filename to be URL-friendly and unique.
  const fileExtension = file.name.split('.').pop();
  const sanitizedFileName = file.name
    .replace(`.${fileExtension}`, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${sanitizedFileName}-${Date.now()}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) {
    console.error('Supabase upload failed. Raw error:', error);
    throw new Error(`Failed to upload file. Message: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    throw new Error('Could not get public URL for the uploaded file.');
  }

  return {
    url: publicUrlData.publicUrl,
    path: filePath, // The full path within the bucket
    name: file.name,
    type: file.type,
  };
}

export async function deleteFileFromStorage(filePath: string) {
    const supabase = createSupabaseClient();
    const bucketName = 'uploads';

    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
        console.error('Failed to delete file from Supabase Storage:', error);
        throw new Error('Could not delete file from storage.');
    }
}
