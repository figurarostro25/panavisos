import { NextResponse } from "next/server";
import { createSessionValue, setAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");

  if (!process.env.PANAVISOS_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin password is not configured." }, { status: 500 });
  }

  if (password !== process.env.PANAVISOS_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
  }

  await setAdminCookie(createSessionValue());
  return NextResponse.json({ ok: true });
}
