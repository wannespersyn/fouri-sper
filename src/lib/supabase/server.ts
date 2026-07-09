import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// TODO: once `supabase start` is running locally, run `npm run supabase:types`
// and swap this for `createServerClient<Database>(...)` with the generated types.

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore because the
            // middleware below refreshes the session on every request.
          }
        },
      },
    }
  );
}
