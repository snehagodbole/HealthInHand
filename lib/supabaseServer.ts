import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { assertSupabasePublicConfig } from "@/lib/supabaseConfig";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseKey } = assertSupabasePublicConfig();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Parameters<NonNullable<CookieMethodsServer["setAll"]>>[0]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server components cannot always set cookies; middleware refreshes them.
          }
        }
      }
    }
  ) as unknown as SupabaseClient<Database>;
}
