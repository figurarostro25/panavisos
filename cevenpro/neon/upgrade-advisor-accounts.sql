-- Cevenpro: cuentas individuales, solicitudes de asesores y sesiones.
-- No elimina ni modifica las propiedades o prospectos existentes.
create extension if not exists pgcrypto;

create table if not exists public.cevenpro_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null default '',
  whatsapp text not null default '',
  website text not null default '',
  bio text not null default '',
  profile_slug text,
  role text not null check (role in ('master', 'advisor')),
  status text not null default 'active' check (status in ('active', 'disabled', 'archived')),
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists public.cevenpro_account_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.cevenpro_users(id) on delete restrict,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.cevenpro_advisor_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null default '',
  applicant_role text not null check (applicant_role in ('corredor', 'referidor', 'vendedor', 'otro')),
  experience text not null default '',
  service_zones text not null default '',
  message text not null default '',
  nationality text not null default '',
  residency_status text not null default '',
  age_range text not null default '',
  work_mode text not null default '',
  recent_activity text not null default '',
  consent_at timestamptz,
  status text not null default 'registered' check (status in ('registered', 'disabled', 'archived')),
  user_id uuid references public.cevenpro_users(id) on delete set null,
  reviewed_by uuid references public.cevenpro_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cevenpro_password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.cevenpro_users(id) on delete restrict,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cevenpro_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_role text not null check (recipient_role in ('master', 'advisor')),
  recipient_user_id uuid references public.cevenpro_users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null default '',
  href text not null default '/admin',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.cevenpro_properties add column if not exists advisor_id uuid references public.cevenpro_users(id) on delete set null;
alter table public.cevenpro_leads add column if not exists advisor_id uuid references public.cevenpro_users(id) on delete set null;

create index if not exists cevenpro_users_role_status_idx on public.cevenpro_users(role, status, created_at desc);
create unique index if not exists cevenpro_users_profile_slug_unique_idx on public.cevenpro_users(profile_slug) where profile_slug is not null;
create index if not exists cevenpro_account_sessions_active_idx on public.cevenpro_account_sessions(token_hash, expires_at);
create index if not exists cevenpro_advisor_applications_status_idx on public.cevenpro_advisor_applications(status, created_at desc);
create index if not exists cevenpro_notifications_unread_idx on public.cevenpro_notifications(recipient_role, recipient_user_id, read_at, created_at desc);
create index if not exists cevenpro_properties_advisor_idx on public.cevenpro_properties(advisor_id, status, created_at desc);
create index if not exists cevenpro_leads_advisor_idx on public.cevenpro_leads(advisor_id, status, created_at desc);
