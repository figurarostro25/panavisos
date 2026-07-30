import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const [{ data: profile, error: profileError }, { data: listings, error: listingError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("listings")
      .select("*, category:categories(*), images:listing_images(*)")
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
