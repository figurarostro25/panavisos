"use client";

import { useState } from "react";

const initial = {
  name: "", email: "", phone: "", applicantRole: "corredor", nationality: "", residencyStatus: "",
  ageRange: "", workMode: "independiente", experience: "", serviceZones: "", recentActivity: "", message: "", password: "", consent: false, website: ""
};

export function AdvisorRegistrationForm() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setSending(true);
    try {
      const response = await fetch("/api/advisor-applications", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible enviar tu solicitud.");
      setForm(initial);
      setStatus("Recibimos tu solicitud. Cuando Cevenpro la apruebe, podrás entrar con el correo y la contraseña que registraste.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSending(false);
    }
  }

  return <form className="lead-form advisor-registration-form" onSubmit={submit}>
    <span className="eyebrow">Red profesional Cevenpro</span><h1>Trabaja con nosotros</h1>
    <p>Buscamos corredores y vendedores que quieran publicar propiedades y atender sus propios contactos desde Cevenpro.</p>
    <div className="form-grid"><label>Nombre completo<input required name="name" value={form.name} onChange={update} autoComplete="name" /></label><label>Correo de tu cuenta<input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" /><small className="field-note">Usa un correo que revises. Será el correo de tu cuenta y se utilizará para futuras notificaciones y recuperación de acceso.</small></label></div>
    <div className="form-grid"><label>WhatsApp<input required name="phone" value={form.phone} onChange={update} autoComplete="tel" placeholder="+507 0000-0000" /></label><label>Perfil<select name="applicantRole" value={form.applicantRole} onChange={update}><option value="corredor">Corredor inmobiliario</option><option value="vendedor">Vendedor o captador</option><option value="referidor">Referidor</option><option value="otro">Otro perfil</option></select></label></div>
    <div className="form-grid"><label>Nacionalidad<input required name="nationality" value={form.nationality} onChange={update} placeholder="Ej. panameña" /></label><label>Estatus en Panamá<select required name="residencyStatus" value={form.residencyStatus} onChange={update}><option value="">Selecciona</option><option>Panameño o residente</option><option>Permiso de trabajo vigente</option><option>En trámite</option><option>Vivo fuera de Panamá</option></select></label></div>
    <div className="form-grid"><label>Rango de edad<select required name="ageRange" value={form.ageRange} onChange={update}><option value="">Selecciona</option><option>18 a 24</option><option>25 a 34</option><option>35 a 44</option><option>45 a 54</option><option>55 o más</option></select></label><label>Modalidad<select name="workMode" value={form.workMode} onChange={update}><option value="independiente">Trabajo independiente</option><option value="empresa">Trabajo con una empresa</option><option value="ambos">Ambas modalidades</option></select></label></div>
    <label>Experiencia y tipo de propiedades<input name="experience" value={form.experience} onChange={update} placeholder="Ej. apartamentos, playa, ventas, alquileres" /></label>
    <label>Zonas que manejas<input name="serviceZones" value={form.serviceZones} onChange={update} placeholder="Ej. Ciudad de Panamá, Costa del Este, Panamá Oeste" /></label>
    <label>Tres propiedades, cierres o alquileres recientes<textarea required name="recentActivity" rows="4" value={form.recentActivity} onChange={update} placeholder="Cuéntanos brevemente tus últimos tres trabajos, eventos o propiedades gestionadas." /></label>
    <label>Mensaje adicional opcional<textarea name="message" rows="3" value={form.message} onChange={update} placeholder="Algo más que debamos conocer." /></label>
    <label>Contraseña para tu cuenta<input required minLength="10" type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" placeholder="Mínimo 10 caracteres" /></label>
    <label className="consent-check"><input required type="checkbox" name="consent" checked={form.consent} onChange={update} /><span>Autorizo a Cevenpro a revisar y usar estos datos únicamente para evaluar mi solicitud, administrar la relación profesional y contactarme sobre el servicio. Entiendo que puedo solicitar la actualización o eliminación de mis datos.</span></label>
    <input className="form-honeypot" tabIndex="-1" autoComplete="off" name="website" value={form.website} onChange={update} aria-hidden="true" />
    {status ? <p className={`form-status ${status.startsWith("Recibimos") ? "" : "error"}`} role="status">{status}</p> : null}
    <button className="button teal" disabled={sending} type="submit">{sending ? "Enviando solicitud..." : "Enviar solicitud"}</button>
    <small>Tu cuenta queda bloqueada hasta que Cevenpro confirme tu incorporación. No se realiza ningún cobro en este formulario.</small>
  </form>;
}
