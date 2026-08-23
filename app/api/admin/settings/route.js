import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const DEFAULT_MAX_LISTING_IMAGES = 5;

function normalizeMaxImages(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return DEFAULT_MAX_LISTING_IMAGES;
  return Math.min(10, Math.max(1, Math.round(nextValue)));
}

async function readMaxListingImages(supabase) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "max_listing_images")
    .maybeSingle();

  if (error) return DEFAULT_MAX_LISTING_IMAGES;
  return normalizeMaxImages(data?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const maxListingImages = await readMaxListingImages(supabase);
  return NextResponse.json({ settings: { maxListingImages } });
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const maxListingImages = normalizeMaxImages(body.maxListingImages);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("app_settings").upsert({
    key: "max_listing_images",
    value: maxListingImages,
    updated_at: new Date().toISOString()
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: { maxListingImages } });
}
