'use client';

import { createBrowserClient } from '@supabase/supabase-js';

// Note: It's important to create the client inside a function so that
// the environment variables are read at runtime on the client side.
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not configured in environment variables.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
