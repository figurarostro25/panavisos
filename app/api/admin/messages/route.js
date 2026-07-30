import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("admin_messages")
    .select("*, listing:listings(id,title,slug,status)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}
