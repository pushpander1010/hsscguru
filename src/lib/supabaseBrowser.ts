// lib/supabaseBrowser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function createSupabaseBrowser() {
  return createClientComponentClient();
}
