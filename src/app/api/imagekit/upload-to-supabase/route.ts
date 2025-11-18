import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Ensure you have these in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase URL or Service Role Key is not defined in environment variables.");
}

// Create a single, admin-level Supabase client for the server-side
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Sanitize filename
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

    // Upload the file to the 'uploads' bucket
    const { data, error } = await supabaseAdmin.storage
      .from('uploads') // Ensure you have a bucket named 'uploads' in Supabase
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Failed to upload file to Supabase.', details: error.message }, { status: 500 });
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('uploads')
      .getPublicUrl(data.path);

    if (!publicUrlData.publicUrl) {
        return NextResponse.json({ error: 'Could not generate public URL for the file.' }, { status: 500 });
    }

    // Return the necessary file details to the client
    return NextResponse.json({
        url: publicUrlData.publicUrl,
        path: data.path, // The path within the bucket
        name: file.name,
        type: file.type,
    }, { status: 200 });

  } catch (e: any) {
    console.error('Server-side upload error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred on the server.', details: e.message }, { status: 500 });
  }
}
