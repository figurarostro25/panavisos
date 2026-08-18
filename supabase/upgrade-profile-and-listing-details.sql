alter table public.profiles
  add column if not exists profession text,
  add column if not exists website_url text,
  add column if not exists bio text,
  add column if not exists interests text,
  add column if not exists referral_code text,
  add column if not exists points integer not null default 0;

alter table public.listings
  add column if not exists property_type text,
  add column if not exists land_area_ha numeric(12, 4),
  add column if not exists item_condition text,
  add column if not exists requested_category text,
  add column if not exists responsibility_accepted boolean not null default false;

create unique index if not exists profiles_referral_code_idx
  on public.profiles(referral_code)
  where referral_code is not null;

insert into public.categories (name, slug, description, sort_order)
values
  ('Empleos', 'empleos', 'Vacantes, trabajos por servicio y oportunidades laborales', 4),
  ('Niñeras y cuidado infantil', 'nineras-cuidado-infantil', 'Cuidado de niños, apoyo familiar y asistencia en casa', 5),
  ('Limpieza del hogar', 'limpieza-del-hogar', 'Limpieza, mantenimiento y apoyo doméstico', 6),
  ('Préstamos y asesoría financiera', 'prestamos-asesoria-financiera', 'Asesoría, préstamos personales y servicios financieros', 7),
  ('Hospedajes', 'hospedajes', 'Habitaciones, alquiler temporal y estadías', 8),
  ('Restaurantes y comida', 'restaurantes-comida', 'Restaurantes, fondas, comida a domicilio y catering', 9),
  ('Belleza y bienestar', 'belleza-bienestar', 'Belleza, masajes, estética y cuidado personal', 10),
  ('Terrenos y lotes', 'terrenos-lotes', 'Terrenos, lotes, fincas y oportunidades de inversión', 11),
  ('Locales comerciales', 'locales-comerciales', 'Locales, oficinas, bodegas y espacios comerciales', 12),
  ('Otros', 'otros', 'Si no encuentras tu categoría, publícala aquí y la revisamos', 99)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
