"use client";

import { createClient } from "@supabase/supabase-js";

let browserClient;

export function hasSupabaseBrowserConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
}

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

export async function completeOAuthRedirect() {
  if (typeof window === "undefined") return null;

  const currentUrl = new URL(window.location.href);
  const code = currentUrl.searchParams.get("code");
  if (!code) return null;

  const supabase = getSupabaseBrowser();
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session;

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return null;
  return data.session || null;
}
