const PRIVATE_LISTING_FIELDS = [
  "advertiser_name",
  "advertiser_phone",
  "advertiser_email",
  "whatsapp",
  "email",
  "user_id",
  "profile"
];

export function sanitizeListingForViewer(listing, isAuthenticated) {
  if (isAuthenticated || !listing) return listing;

  const sanitized = { ...listing };
  PRIVATE_LISTING_FIELDS.forEach((field) => delete sanitized[field]);
  return sanitized;
}

export function sanitizeProfileForViewer(profile, isAuthenticated) {
  return isAuthenticated ? profile : null;
}
