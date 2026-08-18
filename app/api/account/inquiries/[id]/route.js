import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRequestUser } from "@/lib/requestUser";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { user, error: authError } = await getRequestUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "").trim();
  if (!["read", "unread"].includes(status)) {
    return NextResponse.json({ error: "Estado no permitido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: listings, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .eq("user_id", user.id);

  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 500 });

  const listingIds = (listings || []).map((listing) => listing.id).filter(Boolean);
  if (!listingIds.length) {
    return NextResponse.json({ error: "Mensaje no encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("admin_messages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("kind", "inquiry")
    .in("listing_id", listingIds)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Mensaje no encontrado." }, { status: 404 });

  return NextResponse.json({ inquiry: data });
}
