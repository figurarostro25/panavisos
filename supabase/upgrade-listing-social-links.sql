-- Add separate optional social profile links to listings without changing existing records.
alter table public.listings
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;
