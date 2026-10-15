import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./shared";

// Server-only: the service-role key bypasses RLS and must never reach the browser.
// Only import this module from server actions or route handlers.
export function createSupabaseAdminClient() {
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config || !serviceRoleKey) return null;

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
