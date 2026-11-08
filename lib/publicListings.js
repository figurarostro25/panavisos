import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const PUBLIC_LISTING_SELECT =
  "id,user_id,category_id,title,slug,operation,price,budget_min,budget_max,original_price,discount_percent,province,district,address_reference,property_type,bedrooms,bathrooms,area_m2,land_area_ha,item_condition,requested_category,description,whatsapp,email,website_url,instagram_url,facebook_url,advertiser_name,advertiser_phone,lat,lng,status,featured,expires_at,created_at,updated_at,video_url,category:categories(*),images:listing_images(id,url,position),profile:profiles(id,full_name,phone,avatar_url,profession,website_url,bio,interests)";

export async function getPublicListingBySlug(slug) {
  const now = new Date().toISOString();
  return getSupabaseAdmin()
    .from("listings")
    .select(PUBLIC_LISTING_SELECT)
    .eq("slug", slug)
    .in("status", ["active", "sold", "rented"])
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();
}
