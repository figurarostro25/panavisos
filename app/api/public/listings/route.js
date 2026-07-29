import { NextResponse } from "next/server";
import { listingPayload, replaceImages, uniqueSlug } from "@/lib/listings";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function defaultExpiresAt() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString();
}

export async function POST(request) {
  const body = await request.json();

  if (!body.title || !body.category_id || !body.price || !body.province || !body.district || !body.description) {
    return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
  }

  if (!body.advertiser_name || !body.advertiser_phone || !body.advertiser_email || !body.advertiser_age) {
    return NextResponse.json({ error: "Agrega nombre, correo, edad y telefono del anunciante." }, { status: 400 });
  }

  if (body.operation === "Oferta" && !body.expires_at) {
    return NextResponse.json({ error: "Las ofertas deben tener fecha de vigencia." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const payload = listingPayload(
    {
      ...body,
      status: "pending",
      featured: false,
      expires_at: body.expires_at || defaultExpiresAt()
    },
    uniqueSlug(body.title)
  );

  const { data: listing, error } = await supabase
    .from("listings")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const imageError = await replaceImages(supabase, listing.id, body.images || []);
  if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });

  return NextResponse.json({ listing, status: "pending" });
}
