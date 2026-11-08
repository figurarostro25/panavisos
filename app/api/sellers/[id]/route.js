import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const [{ data: profile, error: profileError }, { data: listings, error: listingError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,phone,avatar_url,profession,website_url,bio,interests")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("id,title,slug,operation,price,budget_min,budget_max,province,district,status,images:listing_images(id,url,position)")
      .eq("user_id", id)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("created_at", { ascending: false })
  ]);

  if (profileError || listingError) {
    return NextResponse.json({ error: profileError?.message || listingError?.message }, { status: 500 });
  }

  return NextResponse.json({ profile, listings: listings || [] });
}
