create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  age integer,
  avatar_url text,
  provider text,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  operation text not null default 'Venta',
  price numeric(12, 2) not null default 0,
  original_price numeric(12, 2),
  discount_percent numeric(5, 2),
  province text not null,
  district text not null,
  address_reference text,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area_m2 integer not null default 0,
  description text not null,
  whatsapp text,
  email text,
  website_url text,
  advertiser_name text,
  advertiser_phone text,
  advertiser_email text,
  advertiser_age integer,
  lat numeric(10, 6),
  lng numeric(10, 6),
  status text not null default 'active',
  featured boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  public_id text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  cta_label text,
  cta_url text,
  image_url text,
  placement text not null default 'home',
  status text not null default 'active',
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_category_idx on public.listings(category_id);
create index if not exists listings_featured_idx on public.listings(featured);
create index if not exists listings_expires_at_idx on public.listings(expires_at);
create index if not exists listing_images_listing_idx on public.listing_images(listing_id);
create index if not exists banners_status_idx on public.banners(status);
create index if not exists banners_placement_idx on public.banners(placement);
create index if not exists banners_dates_idx on public.banners(starts_at, ends_at);
create index if not exists profiles_status_idx on public.profiles(status);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.banners enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select
  using (true);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Public can read active listings" on public.listings;
create policy "Public can read active listings"
  on public.listings for select
  using (status = 'active');

drop policy if exists "Public can read listing images" on public.listing_images;
create policy "Public can read listing images"
  on public.listing_images for select
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_images.listing_id
      and listings.status = 'active'
    )
  );

drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
  on public.banners for select
  using (status = 'active');

insert into public.categories (name, slug, description, sort_order)
values
  ('Bienes raices', 'bienes-raices', 'Casas, apartamentos, lotes, fincas y locales', 1),
  ('Autos', 'autos', 'Carros, motos, repuestos y accesorios', 2),
  ('Servicios', 'servicios', 'Profesionales, tecnicos, mantenimiento y asesorias', 3)
on conflict (slug) do nothing;

insert into public.banners (title, subtitle, cta_label, cta_url, placement, status, sort_order)
select *
from (
  values
    ('Publica y encuentra oportunidades en Panama', 'Propiedades, autos, servicios y ofertas locales en un solo lugar.', 'Ver anuncios', '/', 'home', 'active', 1),
    ('Espacio destacado para promociones', 'Usa este banner para resaltar negocios, inmuebles, paquetes o anuncios importantes.', 'Panel admin', '/admin', 'home', 'active', 2)
) as seed(title, subtitle, cta_label, cta_url, placement, status, sort_order)
where not exists (select 1 from public.banners);
