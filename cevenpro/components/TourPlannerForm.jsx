"use client";

import { useMemo, useState } from "react";

const initialForm = {
  name: "", email: "", phone: "", country: "", language: "Español",
  arrivalDate: "", visitDays: "3", wantsVacation: "No", vacationDays: "",
  hotelBudget: "", hotelStyle: "Hotel ejecutivo", hotelAmenities: [],
  propertyType: "Apartamento", purchasePurpose: "Inversión y renta",
  purchaseIntent: "Estoy explorando opciones", targetBudget: "",
  preferredZones: "", needsFinancing: "Deseo evaluar opciones", notes: "", website: ""
};

const amenityOptions = ["Desayuno", "Piscina", "Gimnasio", "Vista al mar", "Cocina", "Cerca de comercios"];

export function TourPlannerForm() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [completed, setCompleted] = useState(false);
  const progress = useMemo(() => `${Math.round((step / 3) * 100)}%`, [step]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleAmenity(value) {
    setForm((current) => ({
      ...current,
      hotelAmenities: current.hotelAmenities.includes(value)
        ? current.hotelAmenities.filter((item) => item !== value)
        : [...current.hotelAmenities, value]
    }));
  }

  function nextStep() {
    setStatus("");
    if (step === 1 && (!form.arrivalDate || !form.visitDays)) {
      setStatus("Selecciona la fecha estimada y la cantidad de días.");
      return;
    }
    if (step === 2 && (!form.purchasePurpose || !form.purchaseIntent || !form.targetBudget)) {
      setStatus("Completa el propósito, tu intención y el presupuesto de compra.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    if (!form.name || !form.email || !form.phone || !form.country) {
      setStatus("Completa tus datos de contacto para preparar la propuesta.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "tour-inmobiliario",
          interest: "Tour inmobiliario para compra",
          budget: form.targetBudget,
          details: {
            arrivalDate: form.arrivalDate, visitDays: form.visitDays,
            wantsVacation: form.wantsVacation, vacationDays: form.vacationDays,
            hotelBudget: form.hotelBudget, hotelStyle: form.hotelStyle,
            hotelAmenities: form.hotelAmenities, propertyType: form.propertyType,
            purchasePurpose: form.purchasePurpose, purchaseIntent: form.purchaseIntent,
            preferredZones: form.preferredZones, needsFinancing: form.needsFinancing,
            language: form.language
          }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo enviar la solicitud.");
      setCompleted(true);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSending(false);
    }
  }

  if (completed) {
    return (
      <section className="tour-form tour-confirmation" aria-live="polite">
        <span className="confirmation-mark">✓</span>
        <span className="eyebrow">Solicitud recibida</span>
        <h2>Estamos preparando tu visita</h2>
        <p>Gracias, {form.name}. Revisaremos tus fechas, presupuesto y objetivo de compra para proponerte una agenda útil, no una lista genérica de propiedades.</p>
        <div className="confirmation-next"><strong>¿Qué ocurre ahora?</strong><span>Un asesor validará la disponibilidad y te contactará por WhatsApp o correo.</span></div>
        <button className="button outline" type="button" onClick={() => { setForm(initialForm); setStep(1); setCompleted(false); }}>Crear otra solicitud</button>
      </section>
    );
  }

  return (
    <form className="tour-form" onSubmit={submit}>
      <span className="eyebrow">Planificación privada</span>
      <h2>Diseñar mi visita</h2>
      <div className="tour-progress" aria-label={`Paso ${step} de 3`}><span style={{ width: progress }} /></div>
      <ol className="tour-steps" aria-label="Pasos del formulario">
        <li className={step >= 1 ? "active" : ""}>Viaje</li>
        <li className={step >= 2 ? "active" : ""}>Compra</li>
        <li className={step >= 3 ? "active" : ""}>Contacto</li>
      </ol>

      {step === 1 ? <fieldset>
        <legend>Tu estadía en Panamá</legend>
        <div className="form-grid">
          <label>Fecha estimada de llegada<input required type="date" name="arrivalDate" value={form.arrivalDate} onChange={update} /></label>
          <label>Días para visitar propiedades<select name="visitDays" value={form.visitDays} onChange={update}>{[1, 2, 3, 4, 5, 6, 7].map((day) => <option key={day} value={day}>{day} {day === 1 ? "día" : "días"}</option>)}</select></label>
          <label>¿También deseas vacacionar?<select name="wantsVacation" value={form.wantsVacation} onChange={update}><option>No</option><option>Sí</option></select></label>
          {form.wantsVacation === "Sí" ? <label>Días adicionales de vacaciones<input min="1" max="30" type="number" name="vacationDays" value={form.vacationDays} onChange={update} placeholder="Ej. 4" /></label> : null}
          <label>Presupuesto de hotel por noche<input name="hotelBudget" value={form.hotelBudget} onChange={update} placeholder="Ej. USD 120–180" /></label>
          <label>Tipo de hospedaje<select name="hotelStyle" value={form.hotelStyle} onChange={update}><option>Hotel ejecutivo</option><option>Hotel de playa</option><option>Apartamento equipado</option><option>Hotel boutique</option><option>Estoy abierto a recomendaciones</option></select></label>
        </div>
        <span className="field-label">Comodidades deseadas</span>
        <div className="choice-grid">{amenityOptions.map((item) => <label key={item}><input checked={form.hotelAmenities.includes(item)} type="checkbox" onChange={() => toggleAmenity(item)} />{item}</label>)}</div>
      </fieldset> : null}

      {step === 2 ? <fieldset>
        <legend>Tu objetivo de compra</legend>
        <div className="form-grid">
          <label>Tipo de propiedad<select name="propertyType" value={form.propertyType} onChange={update}><option>Apartamento</option><option>Casa</option><option>Propiedad de playa</option><option>Terreno o finca</option><option>Local comercial</option><option>Bodega o edificio</option><option>Proyecto para invertir</option></select></label>
          <label>Propósito principal<select name="purchasePurpose" value={form.purchasePurpose} onChange={update}><option>Inversión y renta</option><option>Retirarme en Panamá</option><option>Residencia por inversión</option><option>Vivienda principal</option><option>Segunda vivienda o vacaciones</option><option>Operación comercial</option></select></label>
        </div>
        <label>Intención actual<select name="purchaseIntent" value={form.purchaseIntent} onChange={update}><option>Estoy explorando opciones</option><option>Deseo separar una propiedad</option><option>Quiero comprar y quedarme</option><option>Busco alquiler con opción a compra</option><option>Estoy listo para comprar</option></select></label>
        <div className="form-grid">
          <label>Presupuesto de compra<input required name="targetBudget" value={form.targetBudget} onChange={update} placeholder="Ej. USD 250,000" /></label>
          <label>Financiamiento<select name="needsFinancing" value={form.needsFinancing} onChange={update}><option>Deseo evaluar opciones</option><option>Compra de contado</option><option>Ya tengo preaprobación</option><option>Necesito asesoría financiera</option></select></label>
        </div>
        <label>Zonas que te interesan<input name="preferredZones" value={form.preferredZones} onChange={update} placeholder="Ej. Ciudad de Panamá, playa o montaña" /></label>
      </fieldset> : null}

      {step === 3 ? <fieldset>
        <legend>Datos para coordinar</legend>
        <div className="form-grid">
          <label>Nombre completo<input required name="name" value={form.name} onChange={update} placeholder="Tu nombre" /></label>
          <label>Correo<input required type="email" name="email" value={form.email} onChange={update} placeholder="correo@email.com" /></label>
          <label>WhatsApp<input required name="phone" value={form.phone} onChange={update} placeholder="+507 0000-0000" /></label>
          <label>País de residencia<input required name="country" value={form.country} onChange={update} placeholder="País" /></label>
          <label>Idioma preferido<select name="language" value={form.language} onChange={update}><option>Español</option><option>English</option><option>Português</option><option>Français</option><option>Italiano</option><option>Otro</option></select></label>
        </div>
        <label>Detalles adicionales<textarea name="notes" value={form.notes} onChange={update} rows="4" placeholder="Cuéntanos fechas flexibles, acompañantes, necesidades especiales o dudas" /></label>
        <input className="form-honeypot" tabIndex="-1" autoComplete="off" name="website" value={form.website} onChange={update} aria-hidden="true" />
      </fieldset> : null}

      {status ? <p className="form-status error" role="alert">{status}</p> : null}
      <div className="tour-form-actions">
        {step > 1 ? <button className="button outline" type="button" onClick={() => { setStatus(""); setStep((current) => current - 1); }}>Atrás</button> : <span />}
        {step < 3 ? <button className="button teal" type="button" onClick={nextStep}>Continuar</button> : <button className="button teal" disabled={sending} type="submit">{sending ? "Enviando..." : "Solicitar propuesta de visita"}</button>}
      </div>
      <small>Usaremos estos datos únicamente para atender tu solicitud y coordinar la visita.</small>
    </form>
  );
}
