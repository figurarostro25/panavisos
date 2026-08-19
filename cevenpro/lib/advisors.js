import { ensureAdvisorNetworkSchema, getSql } from "@/lib/db";
import { mapProperty } from "@/lib/properties";

export async function getPublicAdvisor(slug) {
  const safeSlug = String(slug || "").trim().slice(0, 140);
  const sql = getSql();
  if (!safeSlug || !sql) return null;

  try {
    await ensureAdvisorNetworkSchema(sql);
    const [advisor] = await sql`
      select id, name, phone, whatsapp, website, bio, profile_slug
      from public.cevenpro_users
      where role = 'advisor' and status = 'active' and profile_slug = ${safeSlug}
      limit 1
    `;
    if (!advisor) return null;
    const rows = await sql`
      select p.*, u.name as advisor_name, u.phone as advisor_phone, u.whatsapp as advisor_whatsapp, u.website as advisor_website, u.bio as advisor_bio
      from public.cevenpro_properties p
      join public.cevenpro_users u on u.id = p.advisor_id and u.status = 'active'
      where p.advisor_id = ${advisor.id} and p.status = 'published'
      order by p.created_at desc
    `;
    return { ...advisor, properties: rows.map(mapProperty) };
  } catch (error) {
    console.error("[Cevenpro] No se pudo cargar el perfil del asesor.", { message: error?.message });
    return null;
  }
}
