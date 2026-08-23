import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const payload = {
    name: body.name,
    slug: slugify(body.slug || body.name),
    description: body.description || null,
    sort_order: Number(body.sort_order || 0)
  };

  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
