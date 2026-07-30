"use client";

import { createClient } from "@supabase/supabase-js";

let browserClient;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}
