import { NextResponse } from "next/server";
import { getPublicListingBySlug } from "@/lib/publicListings";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: listing, error } = await getPublicListingBySlug(slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!listing) return NextResponse.json({ error: "No encontramos este anuncio." }, { status: 404 });

  let sellerListings = [];
  if (listing.user_id) {
    const { data } = await supabase
      .from("listings")
      .select("id,title,slug,price,province,district,status,images:listing_images(id,url,position)")
      .eq("user_id", listing.user_id)
      .eq("status", "active")
      .neq("id", listing.id)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(8);
    sellerListings = data || [];
  }

  return NextResponse.json({ listing, sellerListings });
}
