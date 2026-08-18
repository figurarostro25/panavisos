import { NextResponse } from "next/server";
import { createRecoveryToken, normalizeAdminEmail } from "@/lib/adminCredentials";
import { getSiteUrl } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeAdminEmail(body.email);
    const ownerEmail = normalizeAdminEmail(process.env.PANAVISOS_ADMIN_EMAIL);

    // Use the same response for unknown addresses so the owner email is not exposed.
    if (!email || !ownerEmail || email !== ownerEmail) {
      return NextResponse.json({ ok: true });
    }

    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Falta configurar RESEND_API_KEY en Vercel." }, { status: 503 });
    }

    const { token, tokenHash } = createRecoveryToken();
    const supabase = getSupabaseAdmin();
    const { error: tokenError } = await supabase.from("admin_recovery_tokens").insert({
      email,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    if (tokenError) {
      console.error("No se pudo guardar el token de recuperación", tokenError);
      return NextResponse.json({ error: "Supabase no pudo guardar el token. Verifica que ejecutaste upgrade-admin-access.sql." }, { status: 503 });
    }

    const resetUrl = `${getSiteUrl()}/admin/recuperar?token=${encodeURIComponent(token)}`;
    const from = String(process.env.NOTIFICATION_FROM_EMAIL || "PanAvisos <onboarding@resend.dev>").trim();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Restablecer acceso al panel de PanAvisos",
        text: [
          "Recibimos una solicitud para restablecer la clave del panel de PanAvisos.",
          "",
          `Abre este enlace dentro de los próximos 30 minutos: ${resetUrl}`,
          "",
          "Si no solicitaste este cambio, puedes ignorar este correo."
        ].join("\n"),
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#102a43"><h2>Restablecer acceso a PanAvisos</h2><p>Recibimos una solicitud para cambiar la clave del panel administrativo.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#0a5a78;color:#fff;text-decoration:none;border-radius:6px">Restablecer clave</a></p><p>Este enlace vence en 30 minutos y solo puede utilizarse una vez.</p></div>`
      })
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      console.error("Resend rechazó el correo de recuperación", details);
      const message = response.status === 401 || response.status === 403
        ? "Resend rechazó la clave API. Revisa RESEND_API_KEY en Vercel."
        : response.status === 422
          ? "Resend rechazó el remitente. Verifica que panavisos.com esté verificado y que NOTIFICATION_FROM_EMAIL sea correcto."
          : "Resend no pudo enviar el correo. Revisa los Logs de Resend.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error inesperado en recuperación de admin", error);
    return NextResponse.json({ error: "No se pudo completar la recuperación. Revisa los Logs del despliegue." }, { status: 500 });
  }
}
