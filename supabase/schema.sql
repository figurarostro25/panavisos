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
  profession text,
  website_url text,
  bio text,
  interests text,
  referral_code text,
  points integer not null default 0,
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
  property_type text,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area_m2 integer not null default 0,
  land_area_ha numeric(12, 4),
  item_condition text,
  requested_category text,
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
  responsibility_accepted boolean not null default false,
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

create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'feedback',
  subject text,
  message text not null,
  sender_name text,
  sender_email text,
  sender_phone text,
  listing_id uuid references public.listings(id) on delete set null,
  listing_title text,
  status text not null default 'unread',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'owner' check (role in ('owner', 'editor')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_recovery_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
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
create unique index if not exists profiles_referral_code_idx on public.profiles(referral_code) where referral_code is not null;
create index if not exists admin_messages_status_idx on public.admin_messages(status);
create index if not exists admin_messages_kind_idx on public.admin_messages(kind);
create index if not exists admin_messages_created_at_idx on public.admin_messages(created_at);
create index if not exists admin_recovery_tokens_email_idx on public.admin_recovery_tokens(email);
create index if not exists admin_recovery_tokens_expires_idx on public.admin_recovery_tokens(expires_at);

insert into public.app_settings (key, value)
values ('max_listing_images', '5'::jsonb)
on conflict (key) do nothing;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.banners enable row level security;
alter table public.admin_messages enable row level security;
alter table public.app_settings enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.admin_recovery_tokens enable row level security;

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

drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
  on public.banners for select
  using (status = 'active');

insert into public.categories (name, slug, description, sort_order)
values
  ('Bienes raices', 'bienes-raices', 'Casas, apartamentos, lotes, fincas y locales', 1),
  ('Autos', 'autos', 'Carros, motos, repuestos y accesorios', 2),
  ('Servicios', 'servicios', 'Profesionales, técnicos, mantenimiento y asesorías', 3),
  ('Empleos', 'empleos', 'Vacantes, trabajos por servicio y oportunidades laborales', 4),
  ('Niñeras y cuidado infantil', 'nineras-cuidado-infantil', 'Cuidado de niños, apoyo familiar y asistencia en casa', 5),
  ('Limpieza del hogar', 'limpieza-del-hogar', 'Limpieza, mantenimiento y apoyo doméstico', 6),
  ('Préstamos y asesoría financiera', 'prestamos-asesoria-financiera', 'Asesoría, préstamos personales y servicios financieros', 7),
  ('Hospedajes', 'hospedajes', 'Habitaciones, alquiler temporal y estadías', 8),
  ('Restaurantes y comida', 'restaurantes-comida', 'Restaurantes, fondas, comida a domicilio y catering', 9),
  ('Belleza y bienestar', 'belleza-bienestar', 'Belleza, masajes, estética y cuidado personal', 10),
  ('Terrenos y lotes', 'terrenos-lotes', 'Terrenos, lotes, fincas y oportunidades de inversión', 11),
  ('Locales comerciales', 'locales-comerciales', 'Locales, oficinas, bodegas y espacios comerciales', 12),
  ('Secretarias y asistentes', 'secretarias-asistentes', 'Secretarias, asistentes administrativos y apoyo de oficina', 13),
  ('Saloneras y meseros', 'saloneras-meseros', 'Saloneras, meseros, atención al cliente y apoyo en restaurantes', 14),
  ('Azafatas y eventos', 'azafatas-eventos', 'Azafatas, promotores, anfitriones y personal para eventos', 15),
  ('Cuidado de adultos mayores', 'cuidado-adultos-mayores', 'Cuidado, acompañamiento y asistencia para adultos mayores', 16),
  ('Masajes', 'masajes', 'Masajes terapéuticos, relajantes, deportivos y bienestar corporal', 17),
  ('Otros', 'otros', 'Si no encuentras tu categoría, publícala aquí y la revisamos', 99)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.banners (title, subtitle, cta_label, cta_url, placement, status, sort_order)
select *
from (
  values
    ('Publica y encuentra oportunidades en Panamá', 'Propiedades, autos, servicios y ofertas locales en un solo lugar.', 'Ver anuncios', '/', 'home', 'active', 1),
    ('Espacio destacado para promociones', 'Usa este banner para resaltar negocios, inmuebles, paquetes o anuncios importantes.', 'Panel admin', '/admin', 'home', 'active', 2)
) as seed(title, subtitle, cta_label, cta_url, placement, status, sort_order)
where not exists (select 1 from public.banners);
