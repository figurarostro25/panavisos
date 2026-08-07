import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const message = String(body.message || "").trim();
  const senderEmail = String(body.sender_email || "").trim();
  const kind = String(body.kind || "feedback").slice(0, 40);
  const allowsAnonymousEmail = kind === "demand_suggestion";

  if (!message || message.length < 6) {
    return NextResponse.json({ error: "Escribe un mensaje un poco mas claro." }, { status: 400 });
  }

  if ((!senderEmail || !senderEmail.includes("@")) && !allowsAnonymousEmail) {
    return NextResponse.json({ error: "Agrega un correo para poder dar seguimiento." }, { status: 400 });
  }

  const payload = {
    kind,
    subject: String(body.subject || "").trim().slice(0, 160) || null,
    message: message.slice(0, 4000),
    sender_name: String(body.sender_name || "").trim().slice(0, 120) || null,
    sender_email: senderEmail ? senderEmail.slice(0, 160) : null,
    sender_phone: String(body.sender_phone || "").trim().slice(0, 80) || null,
    listing_id: body.listing_id || null,
    listing_title: String(body.listing_title || "").trim().slice(0, 180) || null,
    status: "unread"
  };

  const { data, error } = await getSupabaseAdmin()
    .from("admin_messages")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
