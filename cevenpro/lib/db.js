import { neon } from "@neondatabase/serverless";

let sqlClient;
let propertyCatalogSchemaPromise;
let advisorNetworkSchemaPromise;

export function getSql() {
  if (sqlClient) return sqlClient;
  const databaseUrl = String(process.env.DATABASE_URL || "").trim();
  if (!databaseUrl) return null;
  sqlClient = neon(databaseUrl);
  return sqlClient;
}

export function isDatabaseConfigured() {
  return Boolean(String(process.env.DATABASE_URL || "").trim());
}

export function ensurePropertyCatalogSchema(sql) {
  if (propertyCatalogSchemaPromise) return propertyCatalogSchemaPromise;
  propertyCatalogSchemaPromise = (async () => {
    await sql`alter table public.cevenpro_properties add column if not exists province text not null default 'Panamá'`;
    await sql`create index if not exists cevenpro_properties_province_zone_idx on public.cevenpro_properties(province, zone, status, created_at desc)`;
  })().catch((error) => {
    propertyCatalogSchemaPromise = null;
    throw error;
  });
  return propertyCatalogSchemaPromise;
}

export function ensureAdvisorNetworkSchema(sql) {
  if (advisorNetworkSchemaPromise) return advisorNetworkSchemaPromise;
  advisorNetworkSchemaPromise = (async () => {
    await sql`alter table public.cevenpro_users add column if not exists profile_slug text`;
    await sql`alter table public.cevenpro_advisor_applications add column if not exists nationality text not null default ''`;
    await sql`alter table public.cevenpro_advisor_applications add column if not exists residency_status text not null default ''`;
    await sql`alter table public.cevenpro_advisor_applications add column if not exists age_range text not null default ''`;
    await sql`alter table public.cevenpro_advisor_applications add column if not exists work_mode text not null default ''`;
    await sql`alter table public.cevenpro_advisor_applications add column if not exists recent_activity text not null default ''`;
    await sql`alter table public.cevenpro_advisor_applications add column if not exists consent_at timestamptz`;
    await sql`
      update public.cevenpro_users
      set profile_slug = 'asesor-' || replace(id::text, '-', '')
      where role = 'advisor' and coalesce(profile_slug, '') = ''
    `;
    await sql`create unique index if not exists cevenpro_users_profile_slug_unique_idx on public.cevenpro_users(profile_slug) where profile_slug is not null`;
  })().catch((error) => {
    advisorNetworkSchemaPromise = null;
    throw error;
  });
  return advisorNetworkSchemaPromise;
}
