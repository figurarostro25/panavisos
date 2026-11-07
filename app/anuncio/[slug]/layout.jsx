import { getPublicListingBySlug } from "@/lib/publicListings";
import { isListingIndexEligible, listingMetaDescription } from "@/lib/listingSeo";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const { data: listing, error } = await getPublicListingBySlug(slug);
    if (error) throw error;
    if (!listing) {
      return {
        title: "Anuncio no disponible | PanAvisos",
        robots: { index: false, follow: true }
      };
    }

    const location = [listing.district, listing.province].filter(Boolean).join(", ");
    const description = listingMetaDescription(listing);
    const indexable = isListingIndexEligible(listing);
    const image = [...(listing.images || [])]
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))[0]?.url;

    return {
      title: `${listing.title}${location ? ` en ${location}` : ""} | PanAvisos`,
      description,
      ...(indexable ? { alternates: { canonical: `/anuncio/${slug}` } } : {}),
      robots: { index: indexable, follow: true },
      openGraph: {
        title: listing.title,
        description,
        type: "article",
        locale: "es_PA",
        images: image ? [{ url: image, alt: listing.title }] : undefined
      }
    };
  } catch {
    return { title: "Anuncio en Panamá | PanAvisos", robots: { index: false, follow: true } };
  }
}

export default function ListingLayout({ children }) {
  return children;
}
