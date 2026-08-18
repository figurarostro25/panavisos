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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banners_status_idx on public.banners(status);
create index if not exists banners_placement_idx on public.banners(placement);

alter table public.banners enable row level security;

drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
  on public.banners for select
  using (status = 'active');

insert into public.banners (title, subtitle, cta_label, cta_url, placement, status, sort_order)
select *
from (
  values
    ('Publica y encuentra oportunidades en Panamá', 'Propiedades, autos, servicios y ofertas locales en un solo lugar.', 'Ver anuncios', '/', 'home', 'active', 1),
    ('Espacio destacado para promociones', 'Usa este banner para resaltar negocios, inmuebles, paquetes o anuncios importantes.', 'Panel admin', '/admin', 'home', 'active', 2)
) as seed(title, subtitle, cta_label, cta_url, placement, status, sort_order)
where not exists (select 1 from public.banners);
