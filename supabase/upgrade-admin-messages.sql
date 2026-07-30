create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'feedback',
  subject text,
  message text not null,
  sender_name text,
  sender_email text,
  sender_phone text,
  listing_id uuid references public.listings(id) on delete set null,
  listing_title text,
  status text not null default 'unread',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_messages_status_idx on public.admin_messages(status);
create index if not exists admin_messages_kind_idx on public.admin_messages(kind);
create index if not exists admin_messages_created_at_idx on public.admin_messages(created_at);

alter table public.admin_messages enable row level security;
