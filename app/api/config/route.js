import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const DEFAULT_MAX_LISTING_IMAGES = 5;

function normalizeMaxImages(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return DEFAULT_MAX_LISTING_IMAGES;
  return Math.min(10, Math.max(1, Math.round(nextValue)));
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("app_settings")
      .select("value")
      .eq("key", "max_listing_images")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ maxListingImages: DEFAULT_MAX_LISTING_IMAGES });
    }

    return NextResponse.json({ maxListingImages: normalizeMaxImages(data?.value) });
  } catch {
    return NextResponse.json({ maxListingImages: DEFAULT_MAX_LISTING_IMAGES });
  }
}
