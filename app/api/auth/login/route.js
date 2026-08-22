import { NextResponse } from "next/server";
import { createSessionValue, setAdminCookie } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/antiSpam";

export const runtime = "nodejs";

export async function POST(request) {
  const limit = rateLimit(request, "admin-login", 8);
  if (!limit.allowed) {
    return NextResponse.json(rateLimitResponse(limit.retryAfter), {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) }
    });
  }
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
