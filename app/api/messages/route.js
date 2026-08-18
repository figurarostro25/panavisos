import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSiteUrl } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const message = String(body.message || "").trim();
  const senderEmail = String(body.sender_email || "").trim();
  const senderPhone = String(body.sender_phone || "").trim();
  const kind = String(body.kind || "feedback").slice(0, 40);
  const allowsAnonymousEmail = kind === "demand_suggestion";
  const requiresGoogle = kind === "support";
  const isListingInquiry = kind === "inquiry";

  if (!message || message.length < 6) {
    return NextResponse.json({ error: "Escribe un mensaje un poco más claro." }, { status: 400 });
  }

  let verifiedUser = null;
  if (requiresGoogle) {
    const token = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Inicia sesión con Google para enviar mensajes de contacto." }, { status: 401 });
    }

    const { data: userData, error: userError } = await getSupabaseAdmin().auth.getUser(token);
    verifiedUser = userData?.user || null;
    const isGoogle =
      verifiedUser?.app_metadata?.provider === "google" ||
      verifiedUser?.identities?.some((identity) => identity.provider === "google");

    if (userError || !verifiedUser || !isGoogle) {
      return NextResponse.json({ error: "Para contactar soporte, entra con Google." }, { status: 403 });
    }
  }

  const effectiveSenderEmail = String(verifiedUser?.email || senderEmail || "").trim();
  const hasValidEmail = isEmail(effectiveSenderEmail);
  const hasValidPhone = isPhone(senderPhone);

  if (isListingInquiry && !hasValidEmail && !hasValidPhone) {
    return NextResponse.json({ error: "Agrega tu correo o tu WhatsApp para que el anunciante pueda responderte." }, { status: 400 });
  }

  if (!isListingInquiry && !hasValidEmail && !allowsAnonymousEmail) {
    return NextResponse.json({ error: "Agrega un correo para poder dar seguimiento." }, { status: 400 });
  }

  if (senderPhone && !hasValidPhone) {
    return NextResponse.json({ error: "Escribe un numero de WhatsApp valido." }, { status: 400 });
  }

  let listingId = body.listing_id || null;
  if (isListingInquiry) {
    if (!listingId) {
      return NextResponse.json({ error: "No encontramos el anuncio que quieres contactar." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await getSupabaseAdmin()
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Ese anuncio ya no esta disponible para recibir mensajes." }, { status: 404 });
    }

    listingId = listing.id;
  }

  const metadata = messageMetadata(request, body.client_meta);
  const finalMessage = metadata ? `${message.slice(0, 3600)}\n\n---\nDatos técnicos:\n${metadata}` : message;

  const payload = {
    kind,
    subject: String(body.subject || "").trim().slice(0, 160) || null,
    message: finalMessage.slice(0, 4000),
    sender_name: String(body.sender_name || verifiedUser?.user_metadata?.full_name || verifiedUser?.user_metadata?.name || "").trim().slice(0, 120) || null,
    sender_email: effectiveSenderEmail ? effectiveSenderEmail.slice(0, 160) : null,
    sender_phone: senderPhone.slice(0, 80) || null,
    listing_id: listingId,
    listing_title: String(body.listing_title || "").trim().slice(0, 180) || null,
    status: "unread"
  };

  const { data, error } = await getSupabaseAdmin()
    .from("admin_messages")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (kind === "inquiry" && payload.listing_id) {
    notifySeller(data).catch((notifyError) => {
      console.error("No se pudo notificar al anunciante", notifyError);
    });
  }

  if (kind === "loan_request" || kind.startsWith("search_request_")) {
    notifyLeadTeam(data).catch((notifyError) => {
      console.error("No se pudo notificar al equipo", notifyError);
    });
  }

  return NextResponse.json({ message: data });
}

async function notifyLeadTeam(lead) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const recipient = String(process.env.PANAVISOS_ADMIN_EMAIL || "").trim();
  if (!apiKey || !recipient.includes("@")) return;

  const isLoan = lead.kind === "loan_request";
  const label = isLoan ? "Préstamos y refinanciamiento" : "Yo busco";
  const siteUrl = getSiteUrl();
  const adminUrl = `${siteUrl}/admin`;
  const from = String(process.env.NOTIFICATION_FROM_EMAIL || "PanAvisos <onboarding@resend.dev>").trim();
  const cleanMessage = String(lead.message || "").split(/\n---\nDatos/i)[0].trim();
  const subject = `Nueva solicitud: ${lead.subject || label}`;
  const text = [
    `Nueva solicitud en el segmento ${label}.`,
    "",
    `Nombre: ${lead.sender_name || "Sin nombre"}`,
    `Correo: ${lead.sender_email || "Sin correo"}`,
    `Teléfono: ${lead.sender_phone || "Sin teléfono"}`,
    "",
    cleanMessage,
    "",
    `Abrir panel: ${adminUrl}`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipient,
      reply_to: lead.sender_email || undefined,
      subject,
      text,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172331">
          <p style="margin:0 0 6px;color:#087f91;font-weight:700">${escapeHtml(label)}</p>
          <h2 style="margin:0 0 16px">${escapeHtml(lead.subject || "Nueva solicitud")}</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(lead.sender_name || "Sin nombre")}</p>
          <p><strong>Correo:</strong> ${escapeHtml(lead.sender_email || "Sin correo")}</p>
          <p><strong>Teléfono:</strong> ${escapeHtml(lead.sender_phone || "Sin teléfono")}</p>
          <hr style="border:0;border-top:1px solid #d9e3e8;margin:18px 0" />
          <p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>
          <p><a href="${adminUrl}">Abrir panel de PanAvisos</a></p>
        </div>
      `
    })
  });

  if (!response.ok) throw new Error(`Resend respondió ${response.status}`);
}

async function notifySeller(inquiry) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return;

  const supabase = getSupabaseAdmin();
  const { data: listing } = await supabase
    .from("listings")
    .select("id,title,slug,user_id,advertiser_email,email")
    .eq("id", inquiry.listing_id)
    .maybeSingle();

  if (!listing) return;

  let sellerEmail = String(listing.advertiser_email || listing.email || "").trim();
  if (!sellerEmail && listing.user_id) {
    const { data: userData } = await supabase.auth.admin.getUserById(listing.user_id);
    sellerEmail = String(userData?.user?.email || "").trim();
  }

  if (!sellerEmail || !sellerEmail.includes("@")) return;

  const siteUrl = getSiteUrl();
  const listingUrl = listing.slug ? `${siteUrl}/anuncio/${listing.slug}` : siteUrl;
  const accountUrl = `${siteUrl}/cuenta`;
  const from = String(process.env.NOTIFICATION_FROM_EMAIL || "PanAvisos <onboarding@resend.dev>").trim();
  const subject = `Nuevo interesado en: ${listing.title || inquiry.listing_title || "tu anuncio"}`;
  const senderName = inquiry.sender_name || "Un visitante";
  const senderEmail = inquiry.sender_email || "Sin correo";
  const senderPhone = inquiry.sender_phone || "Sin telefono";
  const cleanMessage = String(inquiry.message || "").split(/\n---\nDatos/i)[0].trim();

  const text = [
    `Hola, tienes una nueva consulta en PanAvisos.`,
    ``,
    `Anuncio: ${listing.title || inquiry.listing_title || "Anuncio"}`,
    `Enlace: ${listingUrl}`,
    ``,
    `Nombre: ${senderName}`,
    `Correo: ${senderEmail}`,
    `Teléfono: ${senderPhone}`,
    ``,
    `Mensaje:`,
    cleanMessage,
    ``,
    `También puedes verlo en tu cuenta: ${accountUrl}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172331">
      <h2 style="margin:0 0 12px">Nueva consulta en PanAvisos</h2>
      <p><strong>Anuncio:</strong> ${escapeHtml(listing.title || inquiry.listing_title || "Anuncio")}</p>
      <p><a href="${listingUrl}">Ver anuncio</a> | <a href="${accountUrl}">Abrir mi cuenta</a></p>
      <hr style="border:0;border-top:1px solid #e2e8ee;margin:18px 0" />
      <p><strong>Nombre:</strong> ${escapeHtml(senderName)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(senderEmail)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(senderPhone)}</p>
      <p><strong>Mensaje:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: sellerEmail,
      reply_to: inquiry.sender_email || undefined,
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    throw new Error(`Resend respondio ${response.status}`);
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function messageMetadata(request, clientMeta = {}) {
  const headers = request.headers;
  const values = [
    ["País aproximado", headers.get("x-vercel-ip-country")],
    ["Región aproximada", headers.get("x-vercel-ip-country-region")],
    ["Ciudad aproximada", decodeHeader(headers.get("x-vercel-ip-city"))],
    ["Idioma navegador", clientMeta.language || headers.get("accept-language")],
    ["Idiomas", clientMeta.languages],
    ["Zona horaria", clientMeta.timeZone],
    ["Página", clientMeta.page]
  ];

  return values
    .map(([label, value]) => {
      const text = String(value || "").trim();
      return text ? `${label}: ${text.slice(0, 220)}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function decodeHeader(value) {
  try {
    return value ? decodeURIComponent(value) : "";
  } catch {
    return value || "";
  }
}
