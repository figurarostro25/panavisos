const fallbackSiteUrl = "https://www.panavisos.com";

export function getSiteUrl() {
  const candidate = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  return (/^https?:\/\//i.test(candidate) ? candidate : fallbackSiteUrl).replace(/\/$/, "");
}

export function getAuthRedirectOrigin() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return window.location.origin;
    }
  }

  return getSiteUrl();
}
