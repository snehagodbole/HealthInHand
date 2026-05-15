import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertSupabasePublicConfig,
  getSupabasePublicConfigError,
  getSupabasePublicKey,
  isSupabaseSecretKey
} from "@/lib/supabaseConfig";
import type { Database } from "@/types/database";

export const supabaseBrowserConfigError = getSupabasePublicConfigError();

export const hasSupabaseBrowserConfig =
  !supabaseBrowserConfigError &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(getSupabasePublicKey()) &&
  !isSupabaseSecretKey(getSupabasePublicKey());

export const createSupabaseBrowserClient = () => {
  const { supabaseUrl, supabaseKey } = assertSupabasePublicConfig();

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  ) as unknown as SupabaseClient<Database>;
};
