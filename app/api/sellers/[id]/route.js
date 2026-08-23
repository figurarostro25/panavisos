import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PUBLIC_PROFILE_SELECT } from "@/lib/publicProfile";
import { sanitizeListingForViewer, sanitizeProfileForViewer } from "@/lib/listingVisibility";
import { getAuthenticatedViewer } from "@/lib/viewer";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const isAuthenticated = Boolean(await getAuthenticatedViewer(request));
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const [{ data: profile, error: profileError }, { data: listings, error: listingError }] = await Promise.all([
    supabase.from("profiles").select(PUBLIC_PROFILE_SELECT).eq("id", id).maybeSingle(),
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

  return NextResponse.json(
    {
      profile: sanitizeProfileForViewer(profile, isAuthenticated),
      listings: (listings || []).map((listing) => sanitizeListingForViewer(listing, isAuthenticated))
    },
    { headers: { "Cache-Control": isAuthenticated ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=600" } }
  );
}
