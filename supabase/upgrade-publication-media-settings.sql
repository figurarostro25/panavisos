alter table public.listings
  add column if not exists video_url text;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('max_listing_images', '5'::jsonb)
on conflict (key) do nothing;
