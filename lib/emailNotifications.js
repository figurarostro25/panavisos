import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSiteUrl } from "@/lib/site";

const RESEND_URL = "https://api.resend.com/emails";

export async function notifyListingAdvertiser(inquiry) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey || !inquiry?.listing_id) return { sent: false, reason: "not_configured" };

  const supabase = getSupabaseAdmin();
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id,title,slug,user_id,advertiser_email,email")
    .eq("id", inquiry.listing_id)
    .maybeSingle();

  if (listingError) throw new Error(`No se pudo consultar el anuncio: ${listingError.message}`);
  if (!listing) return { sent: false, reason: "listing_not_found" };

  let advertiserEmail = String(listing.advertiser_email || listing.email || "").trim();
  if (!isEmail(advertiserEmail) && listing.user_id) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(listing.user_id);
    if (userError) throw new Error(`No se pudo consultar al anunciante: ${userError.message}`);
    advertiserEmail = String(userData?.user?.email || "").trim();
  }

  if (!isEmail(advertiserEmail)) return { sent: false, reason: "advertiser_email_missing" };

  const siteUrl = getSiteUrl();
  const listingUrl = listing.slug
    ? `${siteUrl}/anuncio/${encodeURIComponent(listing.slug)}`
    : siteUrl;
  const accountUrl = `${siteUrl}/cuenta`;
  const title = listing.title || inquiry.listing_title || "tu anuncio";
  const senderName = inquiry.sender_name || "Un visitante";
  const senderEmail = isEmail(inquiry.sender_email) ? inquiry.sender_email : "Sin correo";
  const senderPhone = inquiry.sender_phone || "Sin teléfono";
  const message = String(inquiry.message || "").split(/\n---\nDatos/i)[0].trim();
  const from = String(
    process.env.NOTIFICATION_FROM_EMAIL || "PanAvisos <onboarding@resend.dev>"
  ).trim();
  const replyTo = isEmail(inquiry.sender_email) ? inquiry.sender_email : undefined;

  const text = [
    "Hola, tienes una nueva consulta en PanAvisos.",
    "",
    `Anuncio: ${title}`,
    `Enlace al anuncio: ${listingUrl}`,
    "",
    `Nombre: ${senderName}`,
    `Correo: ${senderEmail}`,
    `Teléfono: ${senderPhone}`,
    "",
    "Mensaje:",
    message,
    "",
    `Abrir mi cuenta: ${accountUrl}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172331">
      <h2 style="margin:0 0 12px">Nueva consulta en PanAvisos</h2>
      <p><strong>Anuncio:</strong> ${escapeHtml(title)}</p>
      <p><a href="${listingUrl}">Ver anuncio</a> | <a href="${accountUrl}">Abrir mi cuenta</a></p>
      <hr style="border:0;border-top:1px solid #e2e8ee;margin:18px 0" />
      <p><strong>Nombre:</strong> ${escapeHtml(senderName)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(senderEmail)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(senderPhone)}</p>
      <p><strong>Mensaje:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: advertiserEmail,
        reply_to: replyTo,
        subject: `Nuevo interesado en: ${title}`,
        text,
        html
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new Error(`Resend respondió ${response.status}`);
  return { sent: true };
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
