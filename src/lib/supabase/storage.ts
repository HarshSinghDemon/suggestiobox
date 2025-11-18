'use client';

/**
 * Reusable function to upload a file to Supabase Storage.
 *
 * @param file The file object to upload.
 * @returns An object containing the public URL and the path of the uploaded file.
 */
export async function uploadFileToSupabase(file: File) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = 'uploads';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not configured in environment variables.');
  }

  // Sanitize the filename to be URL-friendly and unique.
  const fileExtension = file.name.split('.').pop();
  const sanitizedFileName = file.name
    .replace(`.${fileExtension}`, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${sanitizedFileName}-${Date.now()}.${fileExtension}`;

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    // If the response is not ok, it might be an HTML error page or an API error.
    // We log the raw text to debug the exact issue.
    const rawErrorText = await response.text();
    console.error('Supabase upload failed. Raw response:', rawErrorText);
    throw new Error(`Failed to upload file. Status: ${response.status}.`);
  }

  // --- Expected JSON response from Supabase on success ---
  // {
  //   "Key": "uploads/your-file-name.png",
  //   "Id": "...",
  //   "bucket": "uploads"
  // }
  const result = await response.json();

  // --- Constructing the Public URL ---
  // The pattern is: <supabase-url>/storage/v1/object/public/<bucket-name>/<file-path>
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

  return {
    url: publicUrl,
    path: filePath, // The full path within the bucket
    name: file.name,
    type: file.type,
  };
}
