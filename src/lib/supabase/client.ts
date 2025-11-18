'use client';

import { createClient } from '@supabase/supabase-js';

// --- 1. PASTE YOUR CREDENTIALS HERE ---
const supabaseUrl = "YOUR_SUPABASE_PROJECT_URL"; // Replace with your Project URL
const supabaseAnonKey = "YOUR_SUPABASE_ANON_PUBLIC_KEY"; // Replace with your "anon" public key

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("YOUR_SUPABASE")) {
  // This provides a clear error in the browser console if the keys are not set.
  throw new Error('Supabase URL or Anon Key is not configured. Please edit src/lib/supabase/client.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
