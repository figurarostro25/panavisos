import { NextResponse } from "next/server";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;
  const payload = {
    name: body.name,
    slug: slugify(body.slug || body.name),
    description: body.description || null,
    sort_order: Number(body.sort_order || 0)
  };

  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(_request, { params }) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
