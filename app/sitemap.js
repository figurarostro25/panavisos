import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const staticPages = [
    { url: siteUrl, priority: 1, changeFrequency: "daily" },
    { url: `${siteUrl}/propiedades`, priority: 0.9, changeFrequency: "daily" },
    { url: `${siteUrl}/marketplace`, priority: 0.8, changeFrequency: "daily" },
    { url: `${siteUrl}/terminos`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${siteUrl}/privacidad`, priority: 0.3, changeFrequency: "yearly" }
  ];

  try {
    const now = new Date().toISOString();
    const { data: listings, error } = await getSupabaseAdmin()
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return [
      ...staticPages,
      ...(listings || []).map((listing) => ({
        url: `${siteUrl}/anuncio/${listing.slug}`,
        lastModified: listing.updated_at || undefined,
        changeFrequency: "weekly",
        priority: 0.7
      }))
    ];
  } catch {
    return staticPages;
  }
}
