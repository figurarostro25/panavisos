import { NextResponse } from "next/server";
import { accessToken, INTERNAL_COOKIE, validInternalCredentials } from "@/lib/internalAccess";
import { applyAccountSession, createAccountSession, normalizeEmail, verifyPassword } from "@/lib/accountAuth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const login = String(body.email || body.username || "").trim();
  const password = String(body.password || "");
  const sql = getSql();

  if (sql && login.includes("@")) {
    try {
      const [user] = await sql`
        select id, password_hash, status, role from public.cevenpro_users
        where email = ${normalizeEmail(login)}
        limit 1
      `;
      if (user && await verifyPassword(password, user.password_hash)) {
        if (user.status !== "active") return NextResponse.json({ error: "Tu cuenta está desactivada. Contacta a Cevenpro para revisarla." }, { status: 403 });
        const token = await createAccountSession(sql, user.id);
        return applyAccountSession(NextResponse.json({ ok: true, role: user.role }), token);
      }
    } catch (error) {
      console.error("[Cevenpro] No se pudo iniciar sesión con cuenta.", { message: error?.message });
    }
  }

  // Compatibility only for the existing master/team passwords while their real accounts are activated.
  const role = body.role === "owner" ? "owner" : "seller";
  if (!validInternalCredentials(login, password, role)) return NextResponse.json({ error: "El correo o la clave no son correctos." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(INTERNAL_COOKIE, `${role}:${accessToken(role)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
