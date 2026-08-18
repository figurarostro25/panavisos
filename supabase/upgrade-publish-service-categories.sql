insert into public.categories (name, slug, description, sort_order)
values
  ('Secretarias y asistentes', 'secretarias-asistentes', 'Secretarias, asistentes administrativos y apoyo de oficina', 13),
  ('Saloneras y meseros', 'saloneras-meseros', 'Saloneras, meseros, atencion al cliente y apoyo en restaurantes', 14),
  ('Azafatas y eventos', 'azafatas-eventos', 'Azafatas, promotores, anfitriones y personal para eventos', 15),
  ('Cuidado de adultos mayores', 'cuidado-adultos-mayores', 'Cuidado, acompanamiento y asistencia para adultos mayores', 16),
  ('Masajes', 'masajes', 'Masajes terapeuticos, relajantes, deportivos y bienestar corporal', 17),
  ('Tramites financieros', 'tramites-financieros', 'Gestiones, financiamiento y asesorias financieras', 50),
  ('Tramites legales', 'tramites-legales', 'Gestiones legales, migratorias y documentales', 51),
  ('Servicios profesionales', 'servicios-profesionales', 'Servicios especializados para personas y negocios', 52)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
