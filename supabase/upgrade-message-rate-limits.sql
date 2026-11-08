-- Run this once in the Supabase SQL Editor before deploying the matching app code.
-- The table stores only keyed IP digests and expires buckets after ten minutes.

create table if not exists public.api_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null
);

create index if not exists api_rate_limits_expires_at_idx on public.api_rate_limits(expires_at);
alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated, service_role;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
  v_retry_after integer;
begin
  if p_key_hash is null
    or p_key_hash !~ '^[0-9a-f]{64}$'
    or p_max_requests is null
    or p_max_requests < 1
    or p_max_requests > 200
    or p_window_seconds is null
    or p_window_seconds < 1
    or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  with expired_keys as (
    select key_hash
    from public.api_rate_limits
    where expires_at <= v_now
    order by expires_at
    limit 100
    for update skip locked
  )
  delete from public.api_rate_limits as rate_limit
  using expired_keys
  where rate_limit.key_hash = expired_keys.key_hash;

  insert into public.api_rate_limits as current_limit (
    key_hash,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    p_key_hash,
    v_now,
    1,
    v_now + pg_catalog.make_interval(secs => p_window_seconds)
  )
  on conflict (key_hash) do update
  set window_started_at = case
        when current_limit.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
          then v_now
        else current_limit.window_started_at
      end,
      request_count = case
        when current_limit.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
          then 1
        when current_limit.request_count <= p_max_requests
          then current_limit.request_count + 1
        else current_limit.request_count
      end,
      expires_at = case
        when current_limit.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
          then v_now + pg_catalog.make_interval(secs => p_window_seconds)
        else current_limit.expires_at
      end
  returning current_limit.window_started_at, current_limit.request_count
  into v_window_started_at, v_request_count;

  if v_request_count <= p_max_requests then
    return query select true, 0;
    return;
  end if;

  v_retry_after := greatest(
    1,
    ceil(extract(epoch from (
      v_window_started_at + pg_catalog.make_interval(secs => p_window_seconds) - v_now
    )))::integer
  );
  return query select false, v_retry_after;
end;
$function$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;
