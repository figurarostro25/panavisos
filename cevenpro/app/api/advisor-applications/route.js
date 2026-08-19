import { NextResponse } from "next/server";
import { cleanAccountText, hashPassword, normalizeEmail, passwordIsValid } from "@/lib/accountAuth";
import { ensureAdvisorNetworkSchema, getSql } from "@/lib/db";
import { notifyMaster } from "@/lib/email";

export const runtime = "nodejs";

const acceptedRoles = new Set(["corredor", "referidor", "vendedor", "otro"]);
const acceptedWorkModes = new Set(["independiente", "empresa", "ambos"]);

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ ok: true });

  const name = cleanAccountText(body.name, 140);
  const email = normalizeEmail(body.email);
  const phone = cleanAccountText(body.phone, 60);
  const nationality = cleanAccountText(body.nationality, 100);
  const residencyStatus = cleanAccountText(body.residencyStatus, 100);
  const ageRange = cleanAccountText(body.ageRange, 40);
  const recentActivity = cleanAccountText(body.recentActivity, 3000);
  const password = String(body.password || "");
  const applicantRole = acceptedRoles.has(body.applicantRole) ? body.applicantRole : "otro";
  const workMode = acceptedWorkModes.has(body.workMode) ? body.workMode : "independiente";
  const sql = getSql();

  if (!name || !email.includes("@") || !phone || !nationality || !residencyStatus || !ageRange || !recentActivity || !passwordIsValid(password) || body.consent !== true) {
    return NextResponse.json({ error: "Completa los datos requeridos, una contraseña de al menos 10 caracteres y el consentimiento de privacidad." }, { status: 400 });
  }
  if (!sql) return NextResponse.json({ error: "El registro está terminando de configurarse. Intenta de nuevo más tarde." }, { status: 503 });

  try {
    await ensureAdvisorNetworkSchema(sql);
    const [existing] = await sql`select id, status from public.cevenpro_users where email = ${email} limit 1`;
    if (existing?.status === "active") return NextResponse.json({ error: "Ya existe una cuenta activa con ese correo. Inicia sesión o recupera tu contraseña." }, { status: 409 });
    if (existing) return NextResponse.json({ error: "Ya existe una solicitud con ese correo. Espera la revisión de Cevenpro." }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const [user] = await sql`
      insert into public.cevenpro_users (name, email, phone, whatsapp, role, status, password_hash)
      values (${name}, ${email}, ${phone}, ${phone}, 'advisor', 'disabled', ${passwordHash})
      returning id, name, email, role
    `;
    const profileSlug = `asesor-${String(user.id).replaceAll("-", "")}`;
    await sql`update public.cevenpro_users set profile_slug = ${profileSlug}, updated_at = now() where id = ${user.id}`;
    await sql`
      insert into public.cevenpro_advisor_applications (
        full_name, email, phone, applicant_role, experience, service_zones, message, status, user_id,
        nationality, residency_status, age_range, work_mode, recent_activity, consent_at
      ) values (
        ${name}, ${email}, ${phone}, ${applicantRole}, ${cleanAccountText(body.experience, 1000)},
        ${cleanAccountText(body.serviceZones, 300)}, ${cleanAccountText(body.message, 2000)}, 'registered', ${user.id},
        ${nationality}, ${residencyStatus}, ${ageRange}, ${workMode}, ${recentActivity}, now()
      )
    `;
    await sql`
      insert into public.cevenpro_notifications (recipient_role, category, title, body, href)
      values ('master', 'advisor-application', 'Nueva solicitud profesional', ${`${name} solicitó colaborar como ${applicantRole}.`}, '/admin?seccion=asesores')
    `;
    await sql`insert into public.cevenpro_activity (actor_role, entity_type, entity_id, action) values ('advisor', 'advisor', ${user.id}, 'application-submitted')`;
    void notifyMaster({ subject: "Nueva solicitud profesional en Cevenpro", text: `${name} solicitó colaborar como ${applicantRole}.`, href: "/admin?seccion=asesores" }).catch((error) => console.error("[Cevenpro] No se notificó la solicitud.", error));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[Cevenpro] No se pudo registrar la solicitud.", { message: error?.message });
    return NextResponse.json({ error: "No fue posible completar la solicitud. Intenta de nuevo." }, { status: 500 });
  }
}
