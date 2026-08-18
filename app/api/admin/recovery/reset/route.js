import { NextResponse } from "next/server";
import { hashAdminPassword, hashRecoveryToken, normalizeAdminEmail } from "@/lib/adminCredentials";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const password = String(body.password || "");
  const confirmation = String(body.confirmation || "");

  if (!token || password.length < 12 || password !== confirmation) {
    return NextResponse.json({ error: "Usa una clave de al menos 12 caracteres y confirma que coincida." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: recovery, error: recoveryError } = await supabase
    .from("admin_recovery_tokens")
    .select("id,email,expires_at,used_at")
    .eq("token_hash", hashRecoveryToken(token))
    .maybeSingle();

  if (recoveryError || !recovery || recovery.used_at || new Date(recovery.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "El enlace no es válido o ya venció." }, { status: 400 });
  }

  const email = normalizeAdminEmail(recovery.email);
  const passwordHash = hashAdminPassword(password);
  const { error: accountError } = await supabase.from("admin_accounts").upsert({
    email,
    password_hash: passwordHash,
    role: "owner",
    status: "active",
    updated_at: new Date().toISOString()
  }, { onConflict: "email" });

  if (accountError) {
    console.error("No se pudo guardar la nueva clave administrativa", accountError);
    return NextResponse.json({ error: "No se pudo guardar la nueva clave." }, { status: 500 });
  }

  await supabase.from("admin_recovery_tokens").update({ used_at: new Date().toISOString() }).eq("id", recovery.id);
  return NextResponse.json({ ok: true });
}
