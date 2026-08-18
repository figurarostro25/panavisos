-- Acceso propietario del panel y recuperación segura por correo.
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

create index if not exists admin_recovery_tokens_email_idx
  on public.admin_recovery_tokens(email);
create index if not exists admin_recovery_tokens_expires_idx
  on public.admin_recovery_tokens(expires_at);

alter table public.admin_accounts enable row level security;
alter table public.admin_recovery_tokens enable row level security;
