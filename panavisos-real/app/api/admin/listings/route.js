import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listingPayload, replaceImages, uniqueSlug } from "@/lib/listings";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select("*, category:categories(*), images:listing_images(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data });
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const payload = listingPayload(body, uniqueSlug(body.title));

  const { data: listing, error } = await supabase
    .from("listings")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const imageError = await replaceImages(supabase, listing.id, body.images || []);
  if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });

  const { data: fullListing } = await supabase
    .from("listings")
    .select("*, category:categories(*), images:listing_images(*)")
    .eq("id", listing.id)
    .single();

  return NextResponse.json({ listing: fullListing });
}
