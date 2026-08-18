import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRequestUser } from "@/lib/requestUser";

export const runtime = "nodejs";

export async function GET(request) {
  const { user, error: authError } = await getRequestUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: listings, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .eq("user_id", user.id);

  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 500 });

  const listingIds = (listings || []).map((listing) => listing.id).filter(Boolean);
  if (!listingIds.length) return NextResponse.json({ inquiries: [] });

  const { data, error } = await supabase
    .from("admin_messages")
    .select("*, listing:listings(id,title,slug,status)")
    .eq("kind", "inquiry")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inquiries: data || [] });
}
