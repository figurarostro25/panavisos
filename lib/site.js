const fallbackSiteUrl = "https://panavisos-topaz.vercel.app";

export function getSiteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl)
    .trim()
    .replace(/\/$/, "");
}
