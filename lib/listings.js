import { slugify } from "@/lib/format";
import { v2 as cloudinary } from "cloudinary";

export function listingPayload(body, slug = null) {
  const originalPrice = body.original_price === "" || body.original_price == null ? null : Number(body.original_price);
  const discountPercent =
    body.discount_percent === "" || body.discount_percent == null ? null : Number(body.discount_percent);

  const payload = {
    category_id: body.category_id || null,
    title: body.title,
    operation: body.operation || "Venta",
    price: Number(body.price || 0),
    original_price: originalPrice,
    discount_percent: discountPercent,
    province: body.province,
    district: body.district,
    address_reference: body.address_reference || null,
    bedrooms: Number(body.bedrooms || 0),
    bathrooms: Number(body.bathrooms || 0),
    area_m2: Number(body.area_m2 || 0),
    description: body.description,
    whatsapp: body.whatsapp || null,
    email: body.email || null,
    website_url: body.website_url || null,
    advertiser_name: body.advertiser_name || null,
    advertiser_phone: body.advertiser_phone || null,
    advertiser_email: body.advertiser_email || null,
    lat: body.lat === "" || body.lat == null ? null : Number(body.lat),
    lng: body.lng === "" || body.lng == null ? null : Number(body.lng),
    status: body.status || "active",
    featured: Boolean(body.featured),
    expires_at: endOfDay(body.expires_at),
    updated_at: new Date().toISOString()
  };

  if (slug) payload.slug = slug;
  return payload;
}

function endOfDay(value) {
  if (!value) return null;
  if (String(value).includes("T")) return value;
  return `${value}T23:59:59.999Z`;
}

export function uniqueSlug(title) {
  return `${slugify(title)}-${Date.now().toString(36)}`;
}

export async function replaceImages(supabase, listingId, images) {
  const { data: existingImages } = await supabase
    .from("listing_images")
    .select("public_id")
    .eq("listing_id", listingId);
  const nextPublicIds = new Set(images.map((image) => image.public_id).filter(Boolean));
  const removedPublicIds = (existingImages || [])
    .map((image) => image.public_id)
    .filter((publicId) => publicId && !nextPublicIds.has(publicId));

  await deleteCloudinaryImages(removedPublicIds);
  await supabase.from("listing_images").delete().eq("listing_id", listingId);

  if (!images.length) return null;

  const rows = images.map((image, index) => ({
    listing_id: listingId,
    url: image.url,
    public_id: image.public_id || null,
    position: index
  }));

  const { error } = await supabase.from("listing_images").insert(rows);
  return error;
}

export async function deleteCloudinaryImages(publicIds) {
  const ids = publicIds.filter(Boolean);
  if (!ids.length || !process.env.CLOUDINARY_API_SECRET) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  await Promise.allSettled(ids.map((publicId) => cloudinary.uploader.destroy(publicId)));
}
