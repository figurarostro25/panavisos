import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PUBLIC_PROFILE_SELECT } from "@/lib/publicProfile";
import { sanitizeListingForViewer } from "@/lib/listingVisibility";
import { getAuthenticatedViewer } from "@/lib/viewer";

export const runtime = "nodejs";

export async function GET(request) {
  const isAuthenticated = Boolean(await getAuthenticatedViewer(request));
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const [
    { data: categories, error: categoryError },
    { data: listings, error: listingError },
    { data: banners, error: bannerError }
  ] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("name"),
      supabase
        .from("listings")
        .select(`*, category:categories(*), images:listing_images(*), profile:profiles(${PUBLIC_PROFILE_SELECT})`)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("banners")
        .select("*")
        .eq("status", "active")
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order")
        .order("created_at", { ascending: false })
    ]);

  if (categoryError || listingError || bannerError) {
    return NextResponse.json(
      { error: categoryError?.message || listingError?.message || bannerError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      categories: categories || [],
      listings: (listings || []).map((listing) => sanitizeListingForViewer(listing, isAuthenticated)),
      banners: banners || []
    },
    { headers: { "Cache-Control": isAuthenticated ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=600" } }
  );
}
