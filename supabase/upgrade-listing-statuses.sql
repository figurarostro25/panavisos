drop policy if exists "Public can read active listings" on public.listings;
create policy "Public can read active listings"
  on public.listings for select
  using (status in ('active', 'sold', 'rented'));

drop policy if exists "Public can read listing images" on public.listing_images;
create policy "Public can read listing images"
  on public.listing_images for select
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_images.listing_id
      and listings.status in ('active', 'sold', 'rented')
    )
  );
