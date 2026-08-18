insert into public.categories (name, slug, description, sort_order)
values
  ('Secretarias y asistentes', 'secretarias-asistentes', 'Secretarias, asistentes administrativos y apoyo de oficina', 13),
  ('Saloneras y meseros', 'saloneras-meseros', 'Saloneras, meseros, atención al cliente y apoyo en restaurantes', 14),
  ('Azafatas y eventos', 'azafatas-eventos', 'Azafatas, promotores, anfitriones y personal para eventos', 15),
  ('Cuidado de adultos mayores', 'cuidado-adultos-mayores', 'Cuidado, acompañamiento y asistencia para adultos mayores', 16),
  ('Masajes', 'masajes', 'Masajes terapéuticos, relajantes, deportivos y bienestar corporal', 17)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
