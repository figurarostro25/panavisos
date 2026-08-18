import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const { data: listing } = await getSupabaseAdmin()
      .from("listings")
      .select("title, description, district, province, listing_images(url, position)")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (!listing) return { title: "Anuncio no disponible | PanAvisos" };

    const location = [listing.district, listing.province].filter(Boolean).join(", ");
    const description = String(
      listing.description || `${listing.title}${location ? ` en ${location}` : ""}. Consulta detalles en PanAvisos.`
    ).slice(0, 155);
    const image = [...(listing.listing_images || [])]
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))[0]?.url;

    return {
      title: `${listing.title}${location ? ` en ${location}` : ""} | PanAvisos`,
      description,
      alternates: { canonical: `/anuncio/${slug}` },
      openGraph: {
        title: listing.title,
        description,
        type: "article",
        locale: "es_PA",
        images: image ? [{ url: image, alt: listing.title }] : undefined
      }
    };
  } catch {
    return { title: "Anuncio en Panamá | PanAvisos" };
  }
}

export default function ListingLayout({ children }) {
  return children;
}
