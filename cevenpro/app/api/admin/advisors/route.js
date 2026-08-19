import { NextResponse } from "next/server";
import { cleanAccountText, requireAccount } from "@/lib/accountAuth";
import { ensureAdvisorNetworkSchema, getSql } from "@/lib/db";
import { createPasswordSetupLink } from "@/lib/passwordReset";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAccount({ masterOnly: true });
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  try {
    await ensureAdvisorNetworkSchema(sql);
    const advisors = await sql`
      select u.id, u.name, u.email, u.phone, u.whatsapp, u.website, u.bio, u.profile_slug, u.status, u.created_at,
        a.status as application_status, a.applicant_role, a.experience, a.service_zones, a.message,
        a.nationality, a.residency_status, a.age_range, a.work_mode, a.recent_activity, a.consent_at,
        count(distinct p.id)::int as property_count,
        count(distinct l.id) filter (where l.status not in ('closed', 'archived'))::int as open_lead_count
      from public.cevenpro_users u
      left join public.cevenpro_advisor_applications a on a.user_id = u.id
      left join public.cevenpro_properties p on p.advisor_id = u.id
      left join public.cevenpro_leads l on l.advisor_id = u.id
      where u.role = 'advisor'
      group by u.id, a.id
      order by u.created_at desc
    `;
    return NextResponse.json({ advisors });
  } catch (error) {
    console.error("[Cevenpro] No se pudieron cargar los asesores.", { message: error?.message });
    return NextResponse.json({ error: "El módulo de asesores necesita que se aplique la actualización de base de datos." }, { status: 503 });
  }
}

export async function PATCH(request) {
  const master = await requireAccount({ masterOnly: true });
  if (!master) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = cleanAccountText(body.id, 80);
  const action = cleanAccountText(body.action, 80);
  const status = ["active", "disabled", "archived"].includes(body.status) ? body.status : "";
  if (!id || (!status && action !== "create-reset-link")) return NextResponse.json({ error: "Selecciona una cuenta y un estado válido." }, { status: 400 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });

  try {
    await ensureAdvisorNetworkSchema(sql);
    const [existing] = await sql`select id, name, email, status from public.cevenpro_users where id = ${id} and role = 'advisor' limit 1`;
    if (!existing) return NextResponse.json({ error: "El asesor no existe." }, { status: 404 });

    if (action === "create-reset-link") {
      const { link } = await createPasswordSetupLink(sql, existing);
      await sql`insert into public.cevenpro_activity (actor_role, entity_type, entity_id, action, details) values ('master', 'advisor', ${existing.id}, 'reset-link-created', ${JSON.stringify({ by: master.name || 'master' })}::jsonb)`;
      return NextResponse.json({ ok: true, resetLink: link, expiresInMinutes: 30 });
    }

    const [advisor] = await sql`
      update public.cevenpro_users set status = ${status}, disabled_at = case when ${status} = 'disabled' then now() else null end, updated_at = now()
      where id = ${id} and role = 'advisor'
      returning id, name, email, profile_slug, status
    `;
    await sql`
      update public.cevenpro_advisor_applications
      set status = ${status === 'archived' ? 'archived' : status === 'disabled' ? 'disabled' : 'registered'}, reviewed_by = ${master.id || null}, updated_at = now()
      where user_id = ${advisor.id}
    `;
    await sql`insert into public.cevenpro_activity (actor_role, entity_type, entity_id, action, details) values ('master', 'advisor', ${advisor.id}, ${status}, ${JSON.stringify({ by: master.name || 'master' })}::jsonb)`;
    return NextResponse.json({ advisor });
  } catch (error) {
    console.error("[Cevenpro] No se pudo actualizar el asesor.", { message: error?.message });
    return NextResponse.json({ error: "No fue posible actualizar el asesor." }, { status: 500 });
  }
}
