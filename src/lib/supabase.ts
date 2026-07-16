import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn('Supabase URL or key missing; falling back to local data');
}

export const supabase = createClient(url ?? '', key ?? '');

export function isSupabaseConfigured(): boolean {
  return Boolean(url && key);
}
