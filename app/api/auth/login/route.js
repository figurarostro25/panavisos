import { NextResponse } from "next/server";
import { createSessionValueForRole, setAdminCookie } from "@/lib/auth";
import { normalizeAdminEmail, verifyAdminPassword } from "@/lib/adminCredentials";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeAdminEmail(body.email);
  const password = String(body.password || "");

  if (!process.env.PANAVISOS_ADMIN_PASSWORD && !process.env.PANAVISOS_EDITOR_PASSWORD) {
    return NextResponse.json({ error: "Admin password is not configured." }, { status: 500 });
  }

  let role = null;
  let accountFound = false;
  if (email) {
    try {
      const { data: account } = await getSupabaseAdmin()
        .from("admin_accounts")
        .select("email,password_hash,role,status")
        .eq("email", email)
        .eq("status", "active")
        .maybeSingle();
      accountFound = Boolean(account);
      if (account && verifyAdminPassword(password, account.password_hash)) {
        role = account.role === "editor" ? "editor" : "owner";
      }
    } catch (error) {
      console.error("No se pudo consultar la cuenta administrativa", error);
    }
  }

  const configuredOwnerEmail = normalizeAdminEmail(process.env.PANAVISOS_ADMIN_EMAIL);
  if (!role && !accountFound && password && password === process.env.PANAVISOS_ADMIN_PASSWORD && (!email || email === configuredOwnerEmail)) {
    role = "owner";
  }
  if (!role && password && password === process.env.PANAVISOS_EDITOR_PASSWORD && !email) {
    role = "editor";
  }

  if (!role) {
    return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
  }

  await setAdminCookie(createSessionValueForRole(role));
  return NextResponse.json({ ok: true, role });
}
