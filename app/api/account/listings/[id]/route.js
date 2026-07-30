import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { listingPayload, replaceImages } from "@/lib/listings";
import { getRequestUser } from "@/lib/requestUser";

export const runtime = "nodejs";

async function getOwnedListing(supabase, id, userId) {
  return supabase
    .from("listings")
    .select("*, category:categories(*), images:listing_images(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
}

export async function GET(request, { params }) {
  const { user, error: authError } = await getRequestUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await getOwnedListing(getSupabaseAdmin(), id, user.id);

  if (error) return NextResponse.json({ error: "No encontramos ese anuncio en tu cuenta." }, { status: 404 });
  return NextResponse.json({ listing: data });
}

export async function PATCH(request, { params }) {
  const { user, error: authError } = await getRequestUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await getOwnedListing(supabase, id, user.id);

  if (existingError) return NextResponse.json({ error: "No encontramos ese anuncio en tu cuenta." }, { status: 404 });

  const payload = listingPayload(
    {
      ...body,
      user_id: user.id,
      status: existing.status === "inactive" || existing.status === "paused" ? existing.status : "active",
      featured: existing.featured
    },
    existing.slug
  );

  const { error } = await supabase.from("listings").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const imageError = await replaceImages(supabase, id, body.images || []);
  if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });

  const { data: listing } = await getOwnedListing(supabase, id, user.id);
  return NextResponse.json({ listing, status: listing?.status || "active" });
}

export async function DELETE(request, { params }) {
  const { user, error: authError } = await getRequestUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error: existingError } = await getOwnedListing(supabase, id, user.id);
  if (existingError) return NextResponse.json({ error: "No encontramos ese anuncio en tu cuenta." }, { status: 404 });

  const { error } = await supabase.from("listings").update({ status: "inactive", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
