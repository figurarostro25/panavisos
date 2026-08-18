import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");

    if (error) throw error;

    return NextResponse.json(
      { categories: data || [] },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" }
      }
    );
  } catch (error) {
    console.error("No se pudieron cargar las categorias", error?.message || error);
    return NextResponse.json(
      { error: "Las categorias no estan disponibles temporalmente." },
      {
        status: 503,
        headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=3600" }
      }
    );
  }
}
