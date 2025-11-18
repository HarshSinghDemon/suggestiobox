'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // This provides a clear error in the browser console if the keys are not set.
  throw new Error('Supabase URL or Anon Key is not configured in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
