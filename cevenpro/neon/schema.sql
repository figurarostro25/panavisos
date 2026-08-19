create extension if not exists pgcrypto;

create table if not exists public.cevenpro_properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  location text not null,
  province text not null default 'Panamá',
  zone text not null,
  operation text not null check (operation in ('Venta', 'Alquiler')),
  property_type text not null,
  price numeric(14,2),
  price_label text not null,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms numeric(4,1) not null default 0 check (bathrooms >= 0),
  area_label text not null default '',
  image_url text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cevenpro_leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.cevenpro_properties(id) on delete set null,
  source text not null default 'contacto',
  name text not null,
  email text not null,
  phone text not null,
  country text not null default '',
  language text not null default '',
  interest text not null,
  budget text not null default '',
  details jsonb not null default '{}'::jsonb,
  notes text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'visit', 'closed', 'archived')),
  assigned_to text,
  internal_notes text not null default '',
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cevenpro_activity (
  id uuid primary key default gen_random_uuid(),
  actor_role text,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cevenpro_properties_public_idx on public.cevenpro_properties(status, featured desc, created_at desc);
create index if not exists cevenpro_properties_filters_idx on public.cevenpro_properties(operation, property_type, zone);
create index if not exists cevenpro_properties_province_zone_idx on public.cevenpro_properties(province, zone, status, created_at desc);
create index if not exists cevenpro_leads_status_idx on public.cevenpro_leads(status, created_at desc);
create index if not exists cevenpro_leads_property_idx on public.cevenpro_leads(property_id, created_at desc);
create index if not exists cevenpro_activity_entity_idx on public.cevenpro_activity(entity_type, entity_id, created_at desc);
