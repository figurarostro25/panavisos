import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSiteUrl } from "@/lib/site";
import { leadPageList } from "@/lib/leadPages";
import { isListingIndexEligible } from "@/lib/listingSeo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const staticPages = [
    { url: siteUrl, priority: 1, changeFrequency: "daily" },
    { url: `${siteUrl}/propiedades`, priority: 0.9, changeFrequency: "daily" },
    { url: `${siteUrl}/marketplace`, priority: 0.8, changeFrequency: "daily" },
    { url: `${siteUrl}/planes`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${siteUrl}/contacto`, priority: 0.5, changeFrequency: "monthly" },
    ...leadPageList.map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      priority: 0.72,
      changeFrequency: "monthly"
    })),
    { url: `${siteUrl}/terminos`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${siteUrl}/privacidad`, priority: 0.3, changeFrequency: "yearly" }
  ];

  try {
    const now = new Date().toISOString();
    const { data: listings, error } = await getSupabaseAdmin()
      .from("listings")
      .select("slug,updated_at,status,expires_at,title,description,province,district,property_type,item_condition,bedrooms,bathrooms,area_m2,land_area_ha,video_url,images:listing_images(id)")
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return [
      ...staticPages,
      ...(listings || []).filter((listing) => isListingIndexEligible(listing)).map((listing) => ({
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
