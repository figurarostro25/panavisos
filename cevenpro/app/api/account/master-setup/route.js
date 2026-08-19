import { NextResponse } from "next/server";
import { applyAccountSession, cleanAccountText, createAccountSession, getCurrentAccount, hashPassword, normalizeEmail, passwordIsValid } from "@/lib/accountAuth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const legacy = await getCurrentAccount();
  if (!legacy?.legacy || legacy.role !== "master") return NextResponse.json({ error: "Inicia sesión con el acceso actual de administración para activar la cuenta master." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = cleanAccountText(body.name, 140);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!name || !email.includes("@") || !passwordIsValid(password)) return NextResponse.json({ error: "Completa nombre, correo y una contraseña de al menos 10 caracteres." }, { status: 400 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "La base de datos no está disponible." }, { status: 503 });
  try {
    const [master] = await sql`select id from public.cevenpro_users where role = 'master' limit 1`;
    if (master) return NextResponse.json({ error: "La cuenta master ya fue activada. Inicia sesión con tu correo." }, { status: 409 });
    const [user] = await sql`
      insert into public.cevenpro_users (name, email, role, status, password_hash)
      values (${name}, ${email}, 'master', 'active', ${await hashPassword(password)})
      returning id, name, role
    `;
    const token = await createAccountSession(sql, user.id);
    return applyAccountSession(NextResponse.json({ ok: true, user }), token);
  } catch (error) {
    console.error("[Cevenpro] No se pudo activar la cuenta master.", { message: error?.message });
    return NextResponse.json({ error: "No fue posible activar la cuenta. Verifica el correo e intenta nuevamente." }, { status: 500 });
  }
}
