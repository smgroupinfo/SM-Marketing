import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// HARDCODED SUPABASE CREDENTIALS FOR WEB & STANDALONE MOBILE APK DEPLOYMENT
// ==============================================================================
export const SUPABASE_URL = 'https://qbmezzgtsirybenjrsnb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibWV6emd0c2lyeWJlbmpyc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMzYxMTksImV4cCI6MjEwMjYxMjExOX0.VPdouvdSJ8jl5gnqac0tsj3IKnnsu1gWJDp5kqfLe0o';

let supabaseClient = null;

try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
  console.log('[Supabase Client] Connected with hardcoded URL for Web & APK:', SUPABASE_URL);
} catch (err) {
  console.error('[Supabase Client] Initialization error:', err);
}

export const supabase = supabaseClient;
export default supabase;
