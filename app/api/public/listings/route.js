import { NextResponse } from "next/server";
import { listingPayload, replaceImages, uniqueSlug } from "@/lib/listings";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function defaultExpiresAt() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString();
}

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [type, token] = header.split(" ");
  return type?.toLowerCase() === "bearer" ? token : "";
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La publicación no tiene un formato válido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "La publicación no tiene un formato válido." }, { status: 400 });
  }

  const isSearchRequest = body.operation === "Busco";
  if (!body.title || !body.category_id || (!isSearchRequest && !body.price) || !body.province || !body.district || !body.description) {
    return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
  }

  if (isSearchRequest) {
    const phoneDigits = String(body.whatsapp || body.advertiser_phone || "").replace(/\D/g, "");
    if (!body.public_contact_consent || phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Para publicar una búsqueda, autoriza mostrar tu WhatsApp y verifica el número." }, { status: 400 });
    }
    const budgetMin = optionalBudget(body.budget_min);
    const budgetMax = optionalBudget(body.budget_max);
    if (budgetMin.invalid || budgetMax.invalid || (budgetMin.value != null && budgetMax.value != null && budgetMin.value > budgetMax.value)) {
      return NextResponse.json({ error: "Revisa el rango de presupuesto e intenta nuevamente." }, { status: 400 });
    }
  }

  if (body.operation === "Oferta" && !body.expires_at) {
    return NextResponse.json({ error: "Las ofertas deben tener fecha de vigencia." }, { status: 400 });
  }

  if (!body.responsibility_accepted) {
    return NextResponse.json({ error: "Debes aceptar la responsabilidad del anuncio para publicar." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Debes iniciar sesión para publicar." }, { status: 401 });
  }

  const user = authData.user;
  const metadata = user.user_metadata || {};
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("status, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile?.status === "blocked") {
    return NextResponse.json({ error: "Esta cuenta no puede publicar anuncios." }, { status: 403 });
  }

  const provider = user.app_metadata?.provider || "email";
  const advertiserName = body.advertiser_name || metadata.full_name || metadata.name || user.email;
  const advertiserPhone = body.whatsapp || body.advertiser_phone || null;
  const profilePayload = {
    id: user.id,
    full_name: advertiserName,
    phone: advertiserPhone,
    avatar_url: existingProfile?.avatar_url || metadata.avatar_url || metadata.picture || null,
    provider,
    status: "active",
    updated_at: new Date().toISOString()
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ ...profilePayload, role: existingProfile?.role || "user" }, { onConflict: "id" });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { count: profileCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  const founderCourtesy = !profileCount || profileCount <= 100;

  const payload = listingPayload(
    {
      ...body,
      user_id: user.id,
      advertiser_name: advertiserName,
      advertiser_phone: advertiserPhone,
      advertiser_email: user.email,
      whatsapp: advertiserPhone,
      status: "active",
      featured: founderCourtesy && body.featured !== false,
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

  return NextResponse.json({ listing, status: "active" });
}

function optionalBudget(value) {
  if (value === "" || value == null) return { value: null, invalid: false };
  const number = Number(value);
  return { value: number, invalid: !Number.isFinite(number) || number < 0 };
}
