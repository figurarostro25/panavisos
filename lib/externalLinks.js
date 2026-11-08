export function normalizeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function socialPlatformForUrl(value) {
  const href = normalizeExternalUrl(value);
  if (!href) return "";

  const hostname = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) return "instagram";
  if (
    hostname === "facebook.com" ||
    hostname.endsWith(".facebook.com") ||
    hostname === "fb.com" ||
    hostname.endsWith(".fb.com") ||
    hostname === "fb.me"
  ) {
    return "facebook";
  }
  return "";
}

export function normalizeSocialUrl(value, expectedPlatform) {
  const href = normalizeExternalUrl(value);
  return socialPlatformForUrl(href) === expectedPlatform ? href : "";
}

export function getListingContactLinks(listing = {}) {
  const rawWebsite = normalizeExternalUrl(listing.website_url);
  const websitePlatform = socialPlatformForUrl(rawWebsite);
  const instagramUrl =
    normalizeSocialUrl(listing.instagram_url, "instagram") ||
    (websitePlatform === "instagram" ? rawWebsite : "");
  const facebookUrl =
    normalizeSocialUrl(listing.facebook_url, "facebook") ||
    (websitePlatform === "facebook" ? rawWebsite : "");

  return {
    websiteUrl: websitePlatform ? "" : rawWebsite,
    instagramUrl,
    facebookUrl
  };
}
