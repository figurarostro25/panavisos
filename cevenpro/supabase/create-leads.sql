create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'contacto',
  name text not null,
  email text not null,
  phone text,
  country text,
  language text,
  interest text not null,
  budget text,
  details jsonb not null default '{}'::jsonb,
  notes text,
  status text not null default 'new',
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_created_at_idx on public.leads(status, created_at desc);
alter table public.leads enable row level security;

-- No public policies: only the server service role can read or write leads.
