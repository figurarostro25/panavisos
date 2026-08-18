"use client";

import Link from "next/link";
import { useState } from "react";
import { provinces } from "@/lib/format";

const initialForm = {
  requestType: "property",
  name: "",
  email: "",
  phone: "",
  province: "Panama",
  area: "",
  radius: "5 km",
  budget: "",
  target: "",
  salary: "",
  skills: "",
  loanAmount: "",
  loanPurpose: "",
  monthlyIncome: "",
  workStatus: "",
  collateral: "",
  notes: "",
  consent: false
};

const requestTypes = [
  { value: "property", label: "Propiedad o alquiler" },
  { value: "job", label: "Empleo" },
  { value: "vehicle", label: "Auto o moto" },
  { value: "service", label: "Servicio profesional" },
  { value: "product", label: "Producto" },
  { value: "other", label: "Otro" }
];

export function RequestFormPage({ mode = "search" }) {
  const isLoan = mode === "loan";
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.includes("@") || !form.phone.trim()) {
      setError("Completa tu nombre, correo y WhatsApp para poder dar seguimiento.");
      return;
    }

    if (!form.consent) {
      setError("Confirma que podemos contactarte para revisar esta solicitud.");
      return;
    }

    if (isLoan && (!form.loanAmount.trim() || !form.loanPurpose.trim())) {
      setError("Indica el monto aproximado y para qué necesitas el financiamiento.");
      return;
    }

    if (!isLoan && !form.target.trim()) {
      setError("Describe brevemente qué deseas encontrar.");
      return;
    }

    const typeLabel = requestTypes.find((item) => item.value === form.requestType)?.label || "Otro";
    const lines = isLoan
      ? [
          "Segmento: Préstamos y refinanciamiento",
          `Monto aproximado: ${form.loanAmount}`,
          `Objetivo: ${form.loanPurpose}`,
          `Ingreso mensual aproximado: ${form.monthlyIncome || "No indicado"}`,
          `Situación laboral: ${form.workStatus || "No indicada"}`,
          `Garantía disponible: ${form.collateral || "No indicada"}`,
          `Provincia: ${form.province}`,
          `Notas: ${form.notes || "Sin notas adicionales"}`
        ]
      : [
          `Segmento: ${typeLabel}`,
          `Qué busca: ${form.target}`,
          `Provincia: ${form.province}`,
          `Zona preferida: ${form.area || "No indicada"}`,
          `Radio: ${form.radius || "No indicado"}`,
          `Presupuesto: ${form.budget || "No indicado"}`,
          ...(form.requestType === "job"
            ? [`Salario esperado: ${form.salary || "No indicado"}`, `Cualidades/experiencia: ${form.skills || "No indicadas"}`]
            : []),
          `Notas: ${form.notes || "Sin notas adicionales"}`
        ];

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: isLoan ? "loan_request" : `search_request_${form.requestType}`,
          subject: isLoan ? "Solicitud de préstamo o refinanciamiento" : `Yo busco: ${typeLabel}`,
          message: lines.join("\n"),
          sender_name: form.name,
          sender_email: form.email,
          sender_phone: form.phone,
          client_meta: browserMetadata()
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No pudimos enviar la solicitud.");

      setSuccess(
        isLoan
          ? "Solicitud recibida. Un asesor podrá revisarla y contactarte."
          : "Solicitud recibida. La revisaremos para conectarte con opciones relevantes."
      );
      setForm(initialForm);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="request-page">
      <header className="request-header">
        <Link href="/" aria-label="Volver al inicio">
          <img src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav aria-label="Navegación de solicitud">
          <Link href="/">Inicio</Link>
          <Link href="/publicar">Publicar anuncio</Link>
        </nav>
      </header>

      <section className="request-shell">
        <div className="request-intro">
          <span className="eyebrow dark-eyebrow">{isLoan ? "Orientación financiera" : "Yo busco"}</span>
          <h1>{isLoan ? "Cuéntanos qué financiamiento necesitas" : "Dinos qué necesitas encontrar"}</h1>
          <p>
            {isLoan
              ? "Completa los datos básicos. No solicitamos documentos ni información bancaria en este formulario."
              : "Tu solicitud no se publica en el catálogo. La usamos para identificar opciones y facilitar contactos relevantes."}
          </p>
          <ul>
            <li>Solicitud privada y sin costo.</li>
            <li>Datos claros para evitar ofertas que no encajan.</li>
            <li>Seguimiento por correo o WhatsApp.</li>
          </ul>
          {!isLoan ? (
            <div className="request-example">
              <strong>Ejemplo</strong>
              <p>Busco apartamento hasta B/.600 cerca de 12 de Octubre, en un radio de 5 km.</p>
            </div>
          ) : null}
        </div>

        <form className="request-form" onSubmit={submit}>
          <div className="request-form-heading">
            <span>Paso 1 de 1</span>
            <h2>{isLoan ? "Solicitud de orientación" : "Crear solicitud"}</h2>
          </div>

          {!isLoan ? (
            <fieldset className="request-segments">
              <legend>¿Qué estás buscando?</legend>
              {requestTypes.map((item) => (
                <label key={item.value} className={form.requestType === item.value ? "selected" : ""}>
                  <input type="radio" name="requestType" value={item.value} checked={form.requestType === item.value} onChange={update} />
                  <span>{item.label}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          <div className="request-form-row">
            <label>Nombre completo<input name="name" value={form.name} onChange={update} required /></label>
            <label>WhatsApp<input name="phone" value={form.phone} onChange={update} placeholder="+507 6000-0000" required /></label>
          </div>
          <label>Correo electrónico<input name="email" type="email" value={form.email} onChange={update} required /></label>

          {isLoan ? (
            <>
              <div className="request-form-row">
                <label>Monto aproximado<input name="loanAmount" value={form.loanAmount} onChange={update} placeholder="Ej. B/.10,000" required /></label>
                <label>Provincia<select name="province" value={form.province} onChange={update}>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
              </div>
              <label>¿Para qué necesitas el financiamiento?<textarea name="loanPurpose" value={form.loanPurpose} onChange={update} rows={3} placeholder="Préstamo personal, consolidación, refinanciamiento, inversión..." required /></label>
              <div className="request-form-row">
                <label>Ingreso mensual aproximado<select name="monthlyIncome" value={form.monthlyIncome} onChange={update}><option value="">Selecciona</option><option>Menos de B/.1,000</option><option>B/.1,000 a B/.2,999</option><option>B/.3,000 a B/.5,999</option><option>B/.6,000 o más</option></select></label>
                <label>Situación laboral<select name="workStatus" value={form.workStatus} onChange={update}><option value="">Selecciona</option><option>Asalariado</option><option>Independiente</option><option>Empresario</option><option>Jubilado</option><option>Otra</option></select></label>
              </div>
              <label>¿Cuentas con garantía?<select name="collateral" value={form.collateral} onChange={update}><option value="">Selecciona</option><option>Propiedad</option><option>Vehículo</option><option>Otra garantía</option><option>Sin garantía</option><option>No estoy seguro</option></select></label>
            </>
          ) : (
            <>
              <label>Describe lo que buscas<textarea name="target" value={form.target} onChange={update} rows={3} placeholder={searchPlaceholder(form.requestType)} required /></label>
              <div className="request-form-row">
                <label>Provincia<select name="province" value={form.province} onChange={update}>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
                <label>Zona preferida<input name="area" value={form.area} onChange={update} placeholder="Ej. 12 de Octubre" /></label>
              </div>
              <div className="request-form-row">
                <label>Presupuesto<input name="budget" value={form.budget} onChange={update} placeholder="Ej. hasta B/.600" /></label>
                <label>Radio de búsqueda<select name="radius" value={form.radius} onChange={update}><option>1 km</option><option>5 km</option><option>10 km</option><option>20 km</option><option>Todo Panamá</option></select></label>
              </div>
              {form.requestType === "job" ? (
                <div className="request-form-row">
                  <label>Salario esperado<input name="salary" value={form.salary} onChange={update} placeholder="Ej. B/.800 en adelante" /></label>
                  <label>Cualidades o experiencia<input name="skills" value={form.skills} onChange={update} placeholder="Excel, atención al cliente..." /></label>
                </div>
              ) : null}
            </>
          )}

          <label>Detalles adicionales<textarea name="notes" value={form.notes} onChange={update} rows={3} placeholder="Condiciones, horarios, fechas u otra información útil." /></label>
          <label className="request-consent"><input type="checkbox" name="consent" checked={form.consent} onChange={update} /><span>Acepto que PanAvisos y un asesor aliado me contacten para dar seguimiento a esta solicitud.</span></label>

          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
          <button className="primary" type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar solicitud"}</button>
          <small className="request-disclaimer">El envío no garantiza disponibilidad, contratación ni aprobación financiera.</small>
        </form>
      </section>
    </main>
  );
}

function searchPlaceholder(type) {
  if (type === "job") return "Ej. Busco trabajo de secretaria ejecutiva.";
  if (type === "vehicle") return "Ej. Busco Toyota Corolla 2018 o más reciente.";
  if (type === "service") return "Ej. Necesito electricista para apartamento.";
  if (type === "product") return "Ej. Busco equipo de oficina en buen estado.";
  if (type === "property") return "Ej. Busco apartamento de 2 recámaras, céntrico y cerca del metro.";
  return "Describe con claridad lo que necesitas.";
}

function browserMetadata() {
  if (typeof window === "undefined") return {};
  return {
    language: window.navigator.language,
    languages: window.navigator.languages?.join(", "),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    page: window.location.href
  };
}
