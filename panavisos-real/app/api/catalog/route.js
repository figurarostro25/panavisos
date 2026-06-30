import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const [{ data: categories, error: categoryError }, { data: listings, error: listingError }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("name"),
      supabase
        .from("listings")
        .select("*, category:categories(*), images:listing_images(*)")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

  if (categoryError || listingError) {
    return NextResponse.json(
      { error: categoryError?.message || listingError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ categories, listings });
}
