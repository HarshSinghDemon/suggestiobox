'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * Reusable function to upload a file to Supabase Storage directly from the client.
 * This version receives credentials directly to avoid client-side environment variable issues.
 *
 * @param file The file object to upload.
 * @param supabaseUrl The Supabase Project URL.
 * @param supabaseAnonKey The Supabase public anon key.
 * @returns An object containing the public URL and the path of the uploaded file.
 */
export async function uploadFileToSupabase(file: File, supabaseUrl: string, supabaseAnonKey: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key was not provided to the upload function.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const bucketName = 'uploads';

  const fileExtension = file.name.split('.').pop();
  const sanitizedFileName = file.name
    .replace(`.${fileExtension}`, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${sanitizedFileName}-${Date.now()}.${fileExtension}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload failed. Raw error:', uploadError);
    if (uploadError instanceof Error && 'message' in uploadError) {
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

export async function deleteFileFromSupabase(path: string, supabaseUrl: string, supabaseAnonKey: string) {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key was not provided to the delete function.');
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const bucketName = 'uploads';
    const { error } = await supabase.storage.from(bucketName).remove([path]);

    if (error) {
        console.error('Failed to delete file from Supabase Storage:', error);
        throw new Error('Could not delete file from storage.');
    }
}
