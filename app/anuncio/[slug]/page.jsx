import { notFound } from "next/navigation";
import PublicListingClient from "./PublicListingClient";
import { getPublicListingBySlug } from "@/lib/publicListings";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PublicListingPage({ params }) {
  const { slug } = await params;
  const { data: listing, error } = await getPublicListingBySlug(slug);

  if (error) throw error;
  if (!listing) notFound();

  let sellerListings = [];
  if (listing.user_id) {
    const now = new Date().toISOString();
    const { data, error: sellerListingsError } = await getSupabaseAdmin()
      .from("listings")
      .select("id,title,slug,price,province,district,status,images:listing_images(id,url,position)")
      .eq("user_id", listing.user_id)
      .eq("status", "active")
      .neq("id", listing.id)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(8);

    if (sellerListingsError) throw sellerListingsError;
    sellerListings = data || [];
  }

  return <PublicListingClient initialPayload={{ listing, sellerListings }} />;
}
