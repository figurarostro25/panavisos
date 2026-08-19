import { NextResponse } from "next/server";
import { requireInternalUser } from "@/lib/apiAuth";
import { ensurePropertyCatalogSchema, getSql } from "@/lib/db";
import { mapProperty } from "@/lib/properties";
import { normalizeProperty } from "@/lib/propertyInput";

export async function PATCH(request, { params }) {
  const user = await requireInternalUser();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  await ensurePropertyCatalogSchema(sql);
  const { id } = await params;
  const property = normalizeProperty(await request.json().catch(() => ({})));
  if (!property.title || !property.slug || !property.location || !property.province || !property.zone || !property.propertyType || !property.priceLabel) {
    return NextResponse.json({ error: "Completa título, provincia, sector, ubicación, tipo y precio." }, { status: 400 });
  }

  const [existing] = await sql`select id, advisor_id from public.cevenpro_properties where id = ${id} limit 1`;
  if (!existing || (user.role === 'advisor' && user.id && existing.advisor_id !== user.id)) return NextResponse.json({ error: "No tienes permiso para editar esta propiedad." }, { status: 403 });
  const [row] = await sql`
    update public.cevenpro_properties set
      slug = ${property.slug}, title = ${property.title}, description = ${property.description},
      location = ${property.location}, province = ${property.province}, zone = ${property.zone}, operation = ${property.operation},
      property_type = ${property.propertyType}, price = ${property.price}, price_label = ${property.priceLabel},
      bedrooms = ${property.bedrooms}, bathrooms = ${property.bathrooms}, area_label = ${property.areaLabel},
      image_url = ${property.imageUrl}, gallery = ${JSON.stringify(property.gallery)}::jsonb,
      features = ${JSON.stringify(property.features)}::jsonb, featured = ${user.role === 'master' ? property.featured : false},
      status = ${property.status}, updated_by = ${user.name || user.role}, updated_at = now()
    where id = ${id}
    returning *
  `;
  if (!row) return NextResponse.json({ error: "La propiedad no existe." }, { status: 404 });
  await sql`insert into public.cevenpro_activity (actor_role, entity_type, entity_id, action) values (${user.role}, 'property', ${row.id}, 'updated')`;
  return NextResponse.json({ property: mapProperty(row) });
}
