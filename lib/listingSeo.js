const GENERIC_TITLES = new Set(["-", "anuncio", "anuncio disponible", "prueba", "test", "sin titulo"]);

export function cleanListingText(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`#>]/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isListingIndexEligible(listing, now = Date.now()) {
  if (!listing || listing.status !== "active") return false;
  if (listing.expires_at && Date.parse(listing.expires_at) < now) return false;

  const title = cleanListingText(listing.title).toLocaleLowerCase("es");
  const description = cleanListingText(listing.description);
  if (!title || title.length < 8 || GENERIC_TITLES.has(title)) return false;
  if (!listing.province || !listing.district) return false;

  const hasSpecificDetails = Boolean(
    listing.property_type ||
      listing.item_condition ||
      Number(listing.bedrooms) > 0 ||
      Number(listing.bathrooms) > 0 ||
      Number(listing.area_m2) > 0 ||
      Number(listing.land_area_ha) > 0 ||
      listing.video_url ||
      (listing.images || []).length > 1
  );

  // This is PanAvisos' minimum editorial gate, not a Google word-count rule.
  return description.length >= 80 || (description.length >= 35 && hasSpecificDetails);
}

export function listingMetaDescription(listing) {
  const description = cleanListingText(listing?.description);
  const details = [
    listing?.operation,
    listing?.property_type,
    Number(listing?.bedrooms) > 0 ? `${listing.bedrooms} recámaras` : "",
    Number(listing?.bathrooms) > 0 ? `${listing.bathrooms} baños` : "",
    Number(listing?.area_m2) > 0 ? `${listing.area_m2} m²` : "",
    [listing?.district, listing?.province].filter(Boolean).join(", ")
  ].filter(Boolean);
  const prefix = details.join(" · ");
  const text = prefix && description ? `${prefix}. ${description}` : description || prefix;
  return text.slice(0, 155);
}
