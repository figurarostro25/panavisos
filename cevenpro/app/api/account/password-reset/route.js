import { NextResponse } from "next/server";
import { hashPassword, normalizeEmail, passwordIsValid } from "@/lib/accountAuth";
import { getSql } from "@/lib/db";
import { sendPasswordSetupLink, tokenHash } from "@/lib/passwordReset";
const generic = { ok: true, message: "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña." };

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const sql = getSql();
  const email = normalizeEmail(body.email);
  if (!email.includes("@") || !sql) return NextResponse.json(generic);
  try {
    const [user] = await sql`select id, name, email from public.cevenpro_users where email = ${email} and status = 'active' limit 1`;
    if (!user) return NextResponse.json(generic);
    await sendPasswordSetupLink(sql, user);
  } catch (error) {
    console.error("[Cevenpro] No se pudo procesar la recuperación.", { message: error?.message });
  }
  return NextResponse.json(generic);
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "");
  const password = String(body.password || "");
  const sql = getSql();
  if (!token || !passwordIsValid(password) || !sql) return NextResponse.json({ error: "El enlace o la contraseña no son válidos." }, { status: 400 });
  try {
    const [reset] = await sql`
      select id, user_id from public.cevenpro_password_resets
      where token_hash = ${tokenHash(token)} and used_at is null and expires_at > now()
      limit 1
    `;
    if (!reset) return NextResponse.json({ error: "Este enlace ya no es válido. Solicita uno nuevo." }, { status: 400 });
    await sql`update public.cevenpro_users set password_hash = ${await hashPassword(password)}, updated_at = now() where id = ${reset.user_id}`;
    await sql`update public.cevenpro_password_resets set used_at = now() where id = ${reset.id}`;
    await sql`delete from public.cevenpro_account_sessions where user_id = ${reset.user_id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Cevenpro] No se pudo restablecer la contraseña.", { message: error?.message });
    return NextResponse.json({ error: "No fue posible actualizar la contraseña." }, { status: 500 });
  }
}
