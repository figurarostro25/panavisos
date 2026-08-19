import "server-only";

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function sendCevenproEmail({ to, subject, text, html, replyTo }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey || !String(to || "").includes("@")) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: String(process.env.NOTIFICATION_FROM_EMAIL || "Cevenpro <onboarding@resend.dev>").trim(),
      to,
      subject,
      text,
      html: html || `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#11283e">${escapeHtml(text).replaceAll("\n", "<br>")}</div>`,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  if (!response.ok) throw new Error(`El servicio de correo respondió ${response.status}`);
  return true;
}

export async function notifyMaster({ subject, text, href = "/admin" }) {
  const email = String(process.env.CEVENPRO_OWNER_EMAIL || "").trim();
  if (!email.includes("@")) return false;
  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "https://cevenpro.vercel.app").replace(/\/$/, "");
  return sendCevenproEmail({
    to: email,
    subject,
    text: `${text}\n\nRevisar: ${siteUrl}${href}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#11283e"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(text)}</p><p><a href="${siteUrl}${href}" style="display:inline-block;padding:12px 18px;background:#008f96;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">Revisar en Cevenpro</a></p></div>`
  });
}
