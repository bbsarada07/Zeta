import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export let useLocalStorageFallback = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SUPABASE] Environment variables missing. Falling back to LocalStorage.');
  useLocalStorageFallback = true;
}

export const supabase = useLocalStorageFallback
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
