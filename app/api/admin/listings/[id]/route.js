import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { listingPayload, replaceImages } from "@/lib/listings";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("listings")
    .select("slug")
    .eq("id", id)
    .single();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const { error } = await supabase
    .from("listings")
    .update(listingPayload(body, existing.slug))
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const imageError = await replaceImages(supabase, id, body.images || []);
  if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });

  const { data: listing } = await supabase
    .from("listings")
    .select("*, category:categories(*), images:listing_images(*), profile:profiles(*)")
    .eq("id", id)
    .single();

  return NextResponse.json({ listing });
}

export async function DELETE(_request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
