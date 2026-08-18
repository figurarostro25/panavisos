import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*, category:categories(*), images:listing_images(*), profile:profiles(*)")
    .eq("slug", slug)
    .in("status", ["active", "sold", "rented"])
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
      .in("status", ["active", "sold", "rented"])
      .neq("id", listing.id)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(8);
    sellerListings = data || [];
  }

  return NextResponse.json({ listing, sellerListings });
}
