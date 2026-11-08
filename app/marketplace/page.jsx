"use client";

import { CatalogHome } from "@/app/CatalogHome";

export default async function MarketplacePage({ searchParams }) {
  const params = await searchParams;
  return (
    <CatalogHome
      section="marketplace"
      initialListingGroup={params?.grupo || ""}
      initialCategorySlug={params?.categoria || ""}
    />
  );
}
