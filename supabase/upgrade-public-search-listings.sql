-- Add optional budget ranges and a record of consent for public search listings.
-- Existing listings retain their current visibility and contact behavior.
alter table public.listings
  add column if not exists budget_min numeric(12, 2),
  add column if not exists budget_max numeric(12, 2),
  add column if not exists public_contact_consent boolean not null default false;
