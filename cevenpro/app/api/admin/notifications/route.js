import { NextResponse } from "next/server";
import { cleanAccountText, requireAccount } from "@/lib/accountAuth";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAccount();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  try {
    const notifications = user.role === "master"
      ? await sql`select * from public.cevenpro_notifications where recipient_role = 'master' order by created_at desc limit 30`
      : await sql`select * from public.cevenpro_notifications where recipient_role = 'advisor' and recipient_user_id = ${user.id} order by created_at desc limit 30`;
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[Cevenpro] No se pudieron cargar las notificaciones.", { message: error?.message });
    return NextResponse.json({ notifications: [] });
  }
}

export async function PATCH(request) {
  const user = await requireAccount();
  if (!user) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const sql = getSql();
  const body = await request.json().catch(() => ({}));
  const id = cleanAccountText(body.id, 80);
  if (!sql || !id) return NextResponse.json({ error: "Notificación inválida." }, { status: 400 });
  const rows = user.role === "master"
    ? await sql`update public.cevenpro_notifications set read_at = now() where id = ${id} and recipient_role = 'master' returning id`
    : await sql`update public.cevenpro_notifications set read_at = now() where id = ${id} and recipient_user_id = ${user.id} returning id`;
  if (!rows.length) return NextResponse.json({ error: "Notificación no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
