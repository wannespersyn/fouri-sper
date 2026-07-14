import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for privileged auth operations (inviting users, listing
// users). Never import this from client components — the service role key
// bypasses RLS entirely.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
