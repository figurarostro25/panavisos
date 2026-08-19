-- Cevenpro: datos de solicitudes profesionales y perfiles públicos de asesores.
-- No elimina registros ni modifica propiedades existentes.
alter table public.cevenpro_users add column if not exists profile_slug text;
alter table public.cevenpro_advisor_applications add column if not exists nationality text not null default '';
alter table public.cevenpro_advisor_applications add column if not exists residency_status text not null default '';
alter table public.cevenpro_advisor_applications add column if not exists age_range text not null default '';
alter table public.cevenpro_advisor_applications add column if not exists work_mode text not null default '';
alter table public.cevenpro_advisor_applications add column if not exists recent_activity text not null default '';
alter table public.cevenpro_advisor_applications add column if not exists consent_at timestamptz;

update public.cevenpro_users
set profile_slug = 'asesor-' || replace(id::text, '-', '')
where role = 'advisor' and coalesce(profile_slug, '') = '';

create unique index if not exists cevenpro_users_profile_slug_unique_idx
on public.cevenpro_users(profile_slug) where profile_slug is not null;
