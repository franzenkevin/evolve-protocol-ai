import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "[Supabase] Variáveis de ambiente ausentes.\n" +
    `  VITE_SUPABASE_URL: ${SUPABASE_URL ? "OK" : "FALTANDO"}\n` +
    `  VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY: ${SUPABASE_PUBLISHABLE_KEY ? "OK" : "FALTANDO"}`
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  }
});