"use client";

import { useState } from "react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  country: "",
  interest: "",
  budget: "",
  notes: "",
  website: ""
};

export function LeadForm({ title = "Cuéntanos qué necesitas", source = "contacto", compact = false }) {
  const inquiryInterest = source.startsWith("propiedad:") ? "Solicitar información de esta propiedad" : source.startsWith("asesor:") ? "Solicitar información a este asesor" : "";
  const [form, setForm] = useState(() => ({ ...initialForm, interest: inquiryInterest }));
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setSending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo enviar la solicitud.");
      setStatus("Recibimos tu solicitud. Un asesor podrá revisarla y contactarte.");
      setForm({ ...initialForm, interest: inquiryInterest });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={`lead-form ${compact ? "compact" : ""}`} onSubmit={submit}>
      <span className="eyebrow">Solicitud privada</span>
      <h2>{title}</h2>
      <div className="form-grid">
        <label>Nombre completo<input required name="name" value={form.name} onChange={update} placeholder="Tu nombre" /></label>
        <label>Correo<input required type="email" name="email" value={form.email} onChange={update} placeholder="correo@email.com" /></label>
        <label>WhatsApp<input required name="phone" value={form.phone} onChange={update} placeholder="+507 0000-0000" /></label>
        <label>País de residencia<input name="country" value={form.country} onChange={update} placeholder="País" /></label>
      </div>
      {inquiryInterest ? <p className="form-context"><strong>Interés:</strong> {source.startsWith("asesor:") ? "recibir una respuesta directa de este asesor." : "recibir información y disponibilidad de esta propiedad."}</p> : <label>¿Qué deseas lograr?<select required name="interest" value={form.interest} onChange={update}><option value="">Selecciona</option><option>Comprar una propiedad</option><option>Alquilar una propiedad</option><option>Vender o alquilar mi propiedad</option><option>Invertir y obtener residencia</option><option>Financiamiento</option><option>Tour inmobiliario</option><option>Remodelación</option></select></label>}
      <label>Presupuesto o rango<input name="budget" value={form.budget} onChange={update} placeholder="Ej. USD 250,000 o USD 1,500 mensuales" /></label>
      <label>Detalles<textarea name="notes" value={form.notes} onChange={update} rows={compact ? 3 : 4} placeholder="Zonas, fechas, condiciones o dudas" /></label>
      <input className="form-honeypot" tabIndex="-1" autoComplete="off" name="website" value={form.website} onChange={update} aria-hidden="true" />
      {status ? <p className="form-status">{status}</p> : null}
      <button className="button teal" disabled={sending} type="submit">{sending ? "Enviando..." : "Solicitar asesoría"}</button>
      <small>Al enviar aceptas que Cevenpro use estos datos para atender tu solicitud.</small>
    </form>
  );
}
