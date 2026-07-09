import { createBrowserClient } from "@supabase/ssr";
// TODO: once `supabase start` is running locally, run `npm run supabase:types`
// and swap this for `createBrowserClient<Database>(...)` with the generated types.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
