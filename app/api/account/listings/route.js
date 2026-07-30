import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRequestUser } from "@/lib/requestUser";

export const runtime = "nodejs";

export async function GET(request) {
  const { user, error: authError } = await getRequestUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select("*, category:categories(*), images:listing_images(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data || [] });
}
