export function cleanPropertyValue(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

export function slugifyProperty(value) {
  return cleanPropertyValue(value, 180)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function normalizeProperty(body) {
  const title = cleanPropertyValue(body.title, 180);
  return {
    title,
    slug: slugifyProperty(body.slug || title),
    description: cleanPropertyValue(body.description, 5000),
    location: cleanPropertyValue(body.location, 220),
    province: cleanPropertyValue(body.province, 100) || "Panamá",
    zone: cleanPropertyValue(body.zone, 100),
    operation: body.operation === "Alquiler" ? "Alquiler" : "Venta",
    propertyType: cleanPropertyValue(body.propertyType, 100),
    price: Number(body.price || 0),
    priceLabel: cleanPropertyValue(body.priceLabel, 120),
    bedrooms: Math.max(0, Number(body.bedrooms || 0)),
    bathrooms: Math.max(0, Number(body.bathrooms || 0)),
    areaLabel: cleanPropertyValue(body.areaLabel, 100),
    imageUrl: cleanPropertyValue(body.imageUrl, 1200),
    gallery: Array.isArray(body.gallery) ? body.gallery.map((item) => cleanPropertyValue(item, 1200)).filter(Boolean).slice(0, 20) : [],
    features: Array.isArray(body.features) ? body.features.map((item) => cleanPropertyValue(item, 180)).filter(Boolean).slice(0, 30) : [],
    featured: Boolean(body.featured),
    status: ["draft", "published", "archived"].includes(body.status) ? body.status : "draft",
  };
}
