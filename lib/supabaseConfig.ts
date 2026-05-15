const secretKeyPrefix = "sb_secret_";

export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseSecretKey(key: string | undefined) {
  return key?.startsWith(secretKeyPrefix) ?? false;
}

export function getSupabasePublicConfigError() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    return (
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  if (isSupabaseSecretKey(supabaseKey)) {
    return (
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY contains a Supabase secret key. Use a publishable or anon public key instead."
    );
  }

  return null;
}

export function assertSupabasePublicConfig() {
  const configError = getSupabasePublicConfigError();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabasePublicKey();

  if (configError || !supabaseUrl || !supabaseKey) {
    throw new Error(configError ?? "Missing Supabase public configuration.");
  }

  return {
    supabaseUrl,
    supabaseKey
  };
}
