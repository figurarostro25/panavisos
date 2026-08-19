import { NextResponse } from "next/server";
import { requireInternalUser } from "@/lib/apiAuth";
import { ensurePropertyCatalogSchema, getSql } from "@/lib/db";
import { mapProperty } from "@/lib/properties";
import { normalizeProperty } from "@/lib/propertyInput";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireInternalUser();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  await ensurePropertyCatalogSchema(sql);

  const rows = user.role === "advisor" && user.id
    ? await sql`select p.*, u.name as advisor_name from public.cevenpro_properties p left join public.cevenpro_users u on u.id = p.advisor_id where p.advisor_id = ${user.id} order by p.created_at desc`
    : await sql`select p.*, u.name as advisor_name from public.cevenpro_properties p left join public.cevenpro_users u on u.id = p.advisor_id order by p.created_at desc`;
  return NextResponse.json({ properties: rows.map(mapProperty), role: user.role });
}

export async function POST(request) {
  const user = await requireInternalUser();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  await ensurePropertyCatalogSchema(sql);

  const property = normalizeProperty(await request.json().catch(() => ({})));
  if (!property.title || !property.slug || !property.location || !property.province || !property.zone || !property.propertyType || !property.priceLabel) {
    return NextResponse.json({ error: "Completa título, provincia, sector, ubicación, tipo y precio." }, { status: 400 });
  }

  const duplicate = await sql`select 1 from public.cevenpro_properties where slug = ${property.slug} limit 1`;
  if (duplicate.length) property.slug = `${property.slug}-${String(Date.now()).slice(-5)}`;

  const [row] = await sql`
    insert into public.cevenpro_properties (
      slug, title, description, location, province, zone, operation, property_type, price,
      price_label, bedrooms, bathrooms, area_label, image_url, gallery, features,
      featured, status, created_by, updated_by, advisor_id
    ) values (
      ${property.slug}, ${property.title}, ${property.description}, ${property.location}, ${property.province}, ${property.zone},
      ${property.operation}, ${property.propertyType}, ${property.price}, ${property.priceLabel},
      ${property.bedrooms}, ${property.bathrooms}, ${property.areaLabel}, ${property.imageUrl},
      ${JSON.stringify(property.gallery)}::jsonb, ${JSON.stringify(property.features)}::jsonb,
      ${user.role === 'master' ? property.featured : false}, ${property.status}, ${user.name || user.role}, ${user.name || user.role}, ${user.role === 'advisor' ? user.id : null}
    ) returning *
  `;
  await sql`insert into public.cevenpro_activity (actor_role, entity_type, entity_id, action) values (${user.role}, 'property', ${row.id}, 'created')`;
  return NextResponse.json({ property: mapProperty(row) }, { status: 201 });
}
