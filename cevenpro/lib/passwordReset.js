import "server-only";

import crypto from "node:crypto";
import { sendCevenproEmail } from "@/lib/email";

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export { tokenHash };

export async function createPasswordSetupLink(sql, user) {
  const token = crypto.randomBytes(32).toString("base64url");
  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "https://cevenpro.vercel.app").replace(/\/$/, "");
  const link = `${siteUrl}/restablecer-acceso?token=${token}`;

  await sql`delete from public.cevenpro_password_resets where user_id = ${user.id} or expires_at < now()`;
  await sql`insert into public.cevenpro_password_resets (user_id, token_hash, expires_at) values (${user.id}, ${tokenHash(token)}, now() + interval '30 minutes')`;
  return { link };
}

export async function sendPasswordSetupLink(sql, user, { activation = false } = {}) {
  const { link } = await createPasswordSetupLink(sql, user);
  try {
    const sent = await sendCevenproEmail({
      to: user.email,
      subject: activation ? "Tu acceso a Cevenpro está listo" : "Restablece tu contraseña de Cevenpro",
      text: activation
        ? `Hola ${user.name},\n\nTu solicitud para colaborar con Cevenpro fue aprobada. Crea tu contraseña desde este enlace durante los próximos 30 minutos:\n${link}\n\nLuego podrás entrar a tu panel y gestionar tus propiedades.\n\nCevenpro`
        : `Hola ${user.name},\n\nUsa este enlace durante los próximos 30 minutos para crear una nueva contraseña:\n${link}\n\nSi no solicitaste esto, ignora este correo.\n\nCevenpro`
    });
    if (!sent) throw new Error("El servicio de correo no está configurado.");
    return true;
  } catch (error) {
    const token = link.split("token=")[1] || "";
    await sql`delete from public.cevenpro_password_resets where user_id = ${user.id} and token_hash = ${tokenHash(token)}`;
    throw error;
  }
}
