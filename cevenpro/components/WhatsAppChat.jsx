"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function panamaStatus() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Panama", hour: "2-digit", hour12: false }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0) % 24;
  return hour >= 8 && hour < 18;
}

export function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [available, setAvailable] = useState(false);
  const pathname = usePathname();
  const phone = String(process.env.NEXT_PUBLIC_CEVENPRO_WHATSAPP || "").replace(/\D/g, "");

  useEffect(() => {
    const refresh = () => setAvailable(panamaStatus());
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, []);

  if (pathname.startsWith("/propiedades/")) return null;

  const enabled = available && Boolean(phone);
  const message = encodeURIComponent("Hola Cevenpro, deseo orientación sobre propiedades o una visita inmobiliaria en Panamá.");

  return <aside className={`whatsapp-widget ${isOpen ? "open" : ""}`} aria-label="Atención por WhatsApp">
    {isOpen ? <div className="whatsapp-panel">
      <button className="whatsapp-close" type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">×</button>
      <span className={`availability-dot ${enabled ? "online" : ""}`} />
      <strong>{enabled ? "Asesor disponible" : "Atención fuera de horario"}</strong>
      <p>{enabled ? "Escríbenos por WhatsApp. Normalmente respondemos durante el horario de atención." : "El chat atiende de 8:00 a.m. a 6:00 p.m., hora de Panamá. Puedes dejar tu solicitud en el formulario."}</p>
      {enabled ? <a className="button teal" href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer">Iniciar conversación</a> : <a className="button outline" href="/contacto">Dejar una solicitud</a>}
    </div> : null}
    <button className={`whatsapp-trigger ${enabled ? "available" : "unavailable"}`} type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-label={enabled ? "Abrir chat de WhatsApp" : "Ver opciones de contacto"}>
      <span aria-hidden="true">{enabled ? "WA" : "—"}</span><span>{enabled ? "Chat en vivo" : "Chat cerrado"}</span>
    </button>
  </aside>;
}
