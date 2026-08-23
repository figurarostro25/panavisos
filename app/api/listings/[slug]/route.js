import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PUBLIC_PROFILE_SELECT } from "@/lib/publicProfile";
import { sanitizeListingForViewer, sanitizeProfileForViewer } from "@/lib/listingVisibility";
import { getAuthenticatedViewer } from "@/lib/viewer";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const isAuthenticated = Boolean(await getAuthenticatedViewer(request));
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`*, category:categories(*), images:listing_images(*), profile:profiles(${PUBLIC_PROFILE_SELECT})`)
    .eq("slug", slug)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!listing) return NextResponse.json({ error: "No encontramos este anuncio." }, { status: 404 });

  let sellerListings = [];
  if (listing.user_id) {
    const { data } = await supabase
      .from("listings")
      .select("*, category:categories(*), images:listing_images(*)")
      .eq("user_id", listing.user_id)
      .eq("status", "active")
      .neq("id", listing.id)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(8);
    sellerListings = data || [];
  }

  return NextResponse.json(
    {
      listing: {
        ...sanitizeListingForViewer(listing, isAuthenticated),
        profile: sanitizeProfileForViewer(listing.profile, isAuthenticated)
      },
      sellerListings: sellerListings.map((item) => sanitizeListingForViewer(item, isAuthenticated))
    },
    { headers: { "Cache-Control": isAuthenticated ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=600" } }
  );
}
