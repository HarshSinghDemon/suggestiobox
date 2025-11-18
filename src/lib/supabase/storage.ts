'use client';

import { supabase } from './client';

/**
 * Reusable function to upload a file to Supabase Storage directly from the client.
 *
 * @param file The file object to upload.
 * @returns An object containing the public URL and the path of the uploaded file.
 */
export async function uploadFileToSupabase(file: File) {
  // --- 2. PASTE YOUR BUCKET NAME HERE ---
  const bucketName = 'uploads'; // Replace with your bucket name if it's different

  // Sanitize the filename to be URL-friendly and unique.
  const fileExtension = file.name.split('.').pop();
  const sanitizedFileName = file.name
    .replace(`.${fileExtension}`, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Allow dots and underscores in filename
  const filePath = `${sanitizedFileName}-${Date.now()}.${fileExtension}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload failed. Raw error:', uploadError);
    // This is crucial for debugging. If the server returns an HTML error page,
    // this will print it to the console.
    if (uploadError instanceof Error && 'message' in uploadError && !uploadError.message.includes('{')) {
        console.error('Raw Server Response:', uploadError.message);
    }
    throw new Error(`Failed to upload file. Message: ${uploadError.message}`);
  }

  // --- 3. GET THE PUBLIC URL ---
  // The public URL is generated based on a predictable pattern.
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(uploadData.path);

  if (!publicUrlData) {
    throw new Error('Could not get public URL for the uploaded file.');
  }

  // A successful upload response from Supabase looks like this:
  // {
  //   "path": "folder/my-file-1678886400000.png",
  //   "id": "...",
  //   "fullPath": "uploads/folder/my-file-1678886400000.png"
  // }
  //
  // The public URL pattern is:
  // https://<project-id>.supabase.co/storage/v1/object/public/<bucket-name>/<file-path>

  return {
    url: publicUrlData.publicUrl,
    path: uploadData.path, // The path within the bucket, e.g., "my-file-123.png"
    name: file.name,
    type: file.type,
  };
}

export async function deleteFileFromStorage(filePath: string) {
    const bucketName = 'uploads'; // Ensure this matches your bucket name
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
        console.error('Failed to delete file from Supabase Storage:', error);
        throw new Error('Could not delete file from storage.');
    }
}
