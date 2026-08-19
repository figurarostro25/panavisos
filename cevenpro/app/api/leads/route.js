import { ensureAdvisorNetworkSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (body.website) return Response.json({ ok: true });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const interest = String(body.interest || "").trim();

  if (!name || !email.includes("@") || !phone || !interest) {
    return Response.json({ error: "Completa nombre, correo, WhatsApp e interés." }, { status: 400 });
  }

  const lead = {
    source: clean(body.source, 80) || "contacto",
    name: clean(name, 140),
    email: clean(email, 180),
    phone: clean(phone, 80),
    country: clean(body.country, 100),
    language: clean(body.language || body.details?.language, 60),
    interest: clean(interest, 160),
    budget: clean(body.budget, 100),
    details: sanitizeDetails(body.details),
    notes: clean(body.notes, 3000),
    status: "new"
  };

  const [storage, notification] = await Promise.allSettled([
    persistLead(lead),
    notifyLead(lead)
  ]);

  const stored = storage.status === "fulfilled" && storage.value;
  const notified = notification.status === "fulfilled" && notification.value;

  if (!stored && !notified) {
    console.error("Cevenpro lead delivery failed", storage.reason, notification.reason);
    return Response.json({ error: "El canal de solicitudes está terminando de configurarse. Escríbenos durante el horario de atención." }, { status: 503 });
  }

  return Response.json({ ok: true, stored: Boolean(stored), notified: Boolean(notified), receivedAt: new Date().toISOString() });
}

async function persistLead(lead) {
  const sql = getSql();
  if (!sql) return false;
  const propertySlug = lead.source.startsWith("propiedad:") ? lead.source.slice("propiedad:".length) : "";
  const advisorSlug = lead.source.startsWith("asesor:") ? lead.source.slice("asesor:".length) : "";
  if (advisorSlug) await ensureAdvisorNetworkSchema(sql);
  const [property] = propertySlug
    ? await sql`select id, advisor_id from public.cevenpro_properties where slug = ${propertySlug} limit 1`
    : [];
  const [advisor] = advisorSlug
    ? await sql`select id from public.cevenpro_users where role = 'advisor' and status = 'active' and profile_slug = ${advisorSlug} limit 1`
    : [];
  await sql`
    insert into public.cevenpro_leads (
      property_id, advisor_id, source, name, email, phone, country, language, interest, budget, details, notes, status
    ) values (
      ${property?.id || null}, ${property?.advisor_id || advisor?.id || null}, ${lead.source}, ${lead.name}, ${lead.email}, ${lead.phone}, ${lead.country},
      ${lead.language}, ${lead.interest}, ${lead.budget}, ${JSON.stringify(lead.details || {})}::jsonb,
      ${lead.notes}, 'new'
    )
  `;
  try {
    await sql`insert into public.cevenpro_notifications (recipient_role, recipient_user_id, category, title, body, href) values ('master', null, 'lead', 'Nueva consulta', ${`${lead.name} envió una consulta.`}, '/admin?seccion=interesados')`;
    const recipientAdvisorId = property?.advisor_id || advisor?.id;
    if (recipientAdvisorId) await sql`insert into public.cevenpro_notifications (recipient_role, recipient_user_id, category, title, body, href) values ('advisor', ${recipientAdvisorId}, 'lead', 'Nueva consulta para ti', ${lead.name}, '/equipo?seccion=interesados')`;
  } catch (error) {
    console.error("[Cevenpro] No se pudo registrar la notificación interna.", { message: error?.message });
  }
  return true;
}

async function notifyLead(lead) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const ownerEmail = String(process.env.CEVENPRO_OWNER_EMAIL || "").trim();
  if (!apiKey || !ownerEmail.includes("@")) return false;

  const from = String(process.env.NOTIFICATION_FROM_EMAIL || "Cevenpro <onboarding@resend.dev>").trim();
  const subject = lead.source === "tour-inmobiliario" ? `Nueva visita inmobiliaria: ${lead.name}` : `Nueva solicitud Cevenpro: ${lead.name}`;
  const detailRows = Object.entries(lead.details || {}).filter(([, value]) => String(value || "").trim());
  const rows = [
    ["Nombre", lead.name], ["Correo", lead.email], ["WhatsApp", lead.phone],
    ["País", lead.country], ["Idioma", lead.language], ["Interés", lead.interest],
    ["Presupuesto", lead.budget], ...detailRows.map(([key, value]) => [detailLabel(key), Array.isArray(value) ? value.join(", ") : value]),
    ["Observaciones", lead.notes]
  ].filter(([, value]) => String(value || "").trim());

  const ownerResponse = await sendEmail(apiKey, {
    from, to: ownerEmail, reply_to: lead.email, subject,
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#11283e"><p style="color:#07867f;font-weight:700">${escapeHtml(lead.source)}</p><h2>${escapeHtml(subject)}</h2>${rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")}<p><a href="mailto:${escapeHtml(lead.email)}">Responder al cliente</a></p></div>`
  });
  if (!ownerResponse.ok) throw new Error(`Resend respondió ${ownerResponse.status}`);

  const confirmation = await sendEmail(apiKey, {
    from, to: lead.email, subject: "Recibimos tu solicitud en Cevenpro",
    text: `Hola ${lead.name},\n\nRecibimos tu solicitud. Nuestro equipo revisará tus fechas, presupuesto y objetivo para contactarte con una propuesta adecuada.\n\nAtención: 8:00 a.m. a 6:00 p.m., hora de Panamá.\n\nCevenpro`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#11283e"><h2>Gracias, ${escapeHtml(lead.name)}</h2><p>Recibimos tu solicitud correctamente.</p><p>Nuestro equipo revisará tus fechas, presupuesto y objetivo para contactarte con una propuesta adecuada.</p><p><strong>Horario de atención:</strong> 8:00 a.m. a 6:00 p.m., hora de Panamá.</p><p style="color:#07867f;font-weight:700">Cevenpro · Central de Ventas y Proyectos</p></div>`
  });
  if (!confirmation.ok) console.error("No se pudo enviar confirmación al cliente", confirmation.status);
  return true;
}

function sendEmail(apiKey, payload) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function sanitizeDetails(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  return Object.fromEntries(Object.entries(details).slice(0, 30).map(([key, value]) => [clean(key, 80), Array.isArray(value) ? value.slice(0, 12).map((item) => clean(item, 120)) : clean(value, 500)]));
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

function detailLabel(key) {
  const labels = {
    arrivalDate: "Fecha de llegada", visitDays: "Días de visitas", wantsVacation: "Desea vacacionar",
    vacationDays: "Días de vacaciones", hotelBudget: "Presupuesto de hotel", hotelStyle: "Hospedaje",
    hotelAmenities: "Comodidades", propertyType: "Tipo de propiedad", purchasePurpose: "Propósito de compra",
    purchaseIntent: "Intención", preferredZones: "Zonas", needsFinancing: "Financiamiento", language: "Idioma"
  };
  return labels[key] || key;
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
