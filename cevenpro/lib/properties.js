import { properties as fallbackProperties } from "@/data/site";
import { getSql } from "@/lib/db";

export function mapProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    location: row.location,
    province: row.province || "Panamá",
    zone: row.zone,
    operation: row.operation,
    type: row.property_type,
    price: Number(row.price || 0),
    priceLabel: row.price_label,
    beds: Number(row.bedrooms || 0),
    baths: Number(row.bathrooms || 0),
    area: row.area_label || "",
    image: row.image_url || "/images/apartamento-playa.webp",
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    amenities: Array.isArray(row.features) ? row.features : [],
    featured: Boolean(row.featured),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    advisor: row.advisor_name ? {
      name: row.advisor_name,
      whatsapp: row.advisor_whatsapp || row.advisor_phone || "",
      phone: row.advisor_phone || "",
      website: row.advisor_website || "",
      bio: row.advisor_bio || "",
    } : null,
    advisorName: row.advisor_name || "",
  };
}

function withCatalogExamples(properties) {
  const liveSlugs = new Set(properties.map((property) => property.slug));
  return [...properties, ...fallbackProperties.filter((property) => !liveSlugs.has(property.slug))];
}

export async function getPublicProperties() {
  const sql = getSql();
  if (!sql) return fallbackProperties;
  try {
    const rows = await sql`
      select p.*, u.name as advisor_name, u.phone as advisor_phone, u.whatsapp as advisor_whatsapp, u.website as advisor_website, u.bio as advisor_bio
      from public.cevenpro_properties p
      left join public.cevenpro_users u on u.id = p.advisor_id and u.status = 'active'
      where p.status = 'published'
      order by p.created_at desc
    `;
    return rows.length ? withCatalogExamples(rows.map(mapProperty)) : fallbackProperties;
  } catch (error) {
    console.error("[Cevenpro] No se pudo cargar el inventario.", { message: error?.message });
    return fallbackProperties;
  }
}

export async function getPublicProperty(slug) {
  const sql = getSql();
  if (sql) {
    try {
      const [row] = await sql`
        select p.*, u.name as advisor_name, u.phone as advisor_phone, u.whatsapp as advisor_whatsapp, u.website as advisor_website, u.bio as advisor_bio
        from public.cevenpro_properties p
        left join public.cevenpro_users u on u.id = p.advisor_id and u.status = 'active'
        where p.slug = ${slug} and p.status = 'published'
        limit 1
      `;
      if (row) return mapProperty(row);
    } catch (error) {
      console.error("[Cevenpro] No se pudo cargar la propiedad.", { message: error?.message });
    }
  }
  return fallbackProperties.find((property) => property.slug === slug) || null;
}
