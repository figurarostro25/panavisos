alter table public.listings
  add column if not exists original_price numeric(12, 2),
  add column if not exists discount_percent numeric(5, 2),
  add column if not exists advertiser_name text,
  add column if not exists advertiser_phone text,
  add column if not exists advertiser_email text,
  add column if not exists expires_at timestamptz;

alter table public.banners
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

create index if not exists listings_expires_at_idx on public.listings(expires_at);
create index if not exists banners_dates_idx on public.banners(starts_at, ends_at);
