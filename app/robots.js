import { getSiteUrl } from "@/lib/site";

export default function robots() {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/propiedades", "/marketplace", "/anuncio/", "/vendedor/"],
      disallow: ["/admin", "/api/", "/cuenta", "/publicar"]
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
