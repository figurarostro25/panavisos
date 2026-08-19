import { NextResponse } from "next/server";
import { requireInternalUser } from "@/lib/apiAuth";
import { getSql } from "@/lib/db";

function clean(value, max = 3000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function PATCH(request, { params }) {
  const user = await requireInternalUser();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  const { id } = await params;
  const [existing] = await sql`select id, advisor_id from public.cevenpro_leads where id = ${id} limit 1`;
  if (!existing || (user.role === "advisor" && user.id && existing.advisor_id !== user.id)) return NextResponse.json({ error: "No tienes permiso para modificar esta consulta." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const status = ["new", "contacted", "qualified", "visit", "closed", "archived"].includes(body.status) ? body.status : "new";
  const internalNotes = clean(body.internalNotes);
  const assignedTo = clean(body.assignedTo, 120);
  const [lead] = await sql`
    update public.cevenpro_leads set
      status = ${status}, internal_notes = ${internalNotes}, assigned_to = ${assignedTo},
      last_contacted_at = case when ${status} in ('contacted', 'qualified', 'visit', 'closed') then now() else last_contacted_at end,
      updated_at = now()
    where id = ${id}
    returning *
  `;
  if (!lead) return NextResponse.json({ error: "El prospecto no existe." }, { status: 404 });
  await sql`insert into public.cevenpro_activity (actor_role, entity_type, entity_id, action, details) values (${user.role}, 'lead', ${lead.id}, 'updated', ${JSON.stringify({ status })}::jsonb)`;
  return NextResponse.json({ lead });
}
