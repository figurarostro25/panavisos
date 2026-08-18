import { createClient } from "@supabase/supabase-js";

let client;

function validSupabaseUrl(value) {
  const candidate = String(value || "").trim();
  return /^https?:\/\//i.test(candidate) ? candidate : "";
}

export function getSupabaseAdmin() {
  if (client) return client;

  const url = validSupabaseUrl(process.env.SUPABASE_URL) || validSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return client;
}
