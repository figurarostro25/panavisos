-- Cevenpro: ubicación estructurada para los clasificados inmobiliarios.
-- Conserva las propiedades existentes y las asigna inicialmente a Panamá.
alter table public.cevenpro_properties add column if not exists province text not null default 'Panamá';

create index if not exists cevenpro_properties_province_zone_idx
  on public.cevenpro_properties(province, zone, status, created_at desc);
