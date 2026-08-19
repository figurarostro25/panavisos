import { NextResponse } from "next/server";
import { requireInternalUser } from "@/lib/apiAuth";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireInternalUser();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  const leads = user.role === 'advisor' && user.id ? await sql`
    select l.*, p.title as property_title, p.slug as property_slug
    from public.cevenpro_leads l left join public.cevenpro_properties p on p.id = l.property_id
    where l.advisor_id = ${user.id} order by l.created_at desc limit 500
  ` : await sql`
    select l.*, p.title as property_title, p.slug as property_slug
    from public.cevenpro_leads l
    left join public.cevenpro_properties p on p.id = l.property_id
    order by l.created_at desc
    limit 500
  `;
  return NextResponse.json({ leads, role: user.role });
}
