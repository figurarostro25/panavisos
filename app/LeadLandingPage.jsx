"use client";

import { useState } from "react";
import Link from "next/link";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  country: "",
  goal: "",
  budget: "",
  timeline: "",
  visit: "",
  notes: ""
};

export function LeadLandingPage({ page }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitLead(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!form.name.trim() || !form.email.includes("@") || !form.goal.trim()) {
      setError("Completa tu nombre, correo y lo que deseas encontrar para poder dar seguimiento.");
      return;
    }

    const message = [
      `Pagina: ${page.title}`,
      `Pais: ${form.country || "No indicado"}`,
      `${page.goalLabel}: ${form.goal}`,
      `${page.budgetLabel}: ${form.budget || "No indicado"}`,
      `Tiempo/urgencia: ${form.timeline || "No indicado"}`,
      `${page.visitLabel}: ${form.visit || "No indicado"}`,
      `Notas: ${form.notes || "Sin notas adicionales"}`
    ].join("\n");

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: page.kind,
          subject: `Lead: ${page.title}`,
          message,
          sender_name: form.name,
          sender_email: form.email,
          sender_phone: form.phone
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo enviar la solicitud.");

      setStatus("Listo. Recibimos tu solicitud y un asesor puede revisarla.");
      setForm(initialForm);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="lead-page">
      <header className="lead-header">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav aria-label="Navegacion principal">
          <Link href="/propiedades">Propiedades</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/publicar">Publicar</Link>
        </nav>
      </header>

      <section className="lead-hero">
        <div className="lead-hero-copy">
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <div className="lead-actions">
            <a className="primary" href="#solicitud">
              {page.cta}
            </a>
            <Link className="secondary-button" href="/propiedades">
              Ver anuncios
            </Link>
          </div>
        </div>

        <form id="solicitud" className="lead-form-card" onSubmit={submitLead}>
          <span className="eyebrow">Solicitud privada</span>
          <h2>{page.formTitle}</h2>
          <p>{page.formIntro}</p>

          <label>
            Nombre completo
            <input name="name" value={form.name} onChange={updateField} placeholder="Tu nombre" required />
          </label>

          <div className="lead-form-row">
            <label>
              Correo
              <input name="email" type="email" value={form.email} onChange={updateField} placeholder="correo@email.com" required />
            </label>
            <label>
              WhatsApp o telefono
              <input name="phone" value={form.phone} onChange={updateField} placeholder="+507 0000-0000" />
            </label>
          </div>

          <label>
            Pais de residencia
            <input name="country" value={form.country} onChange={updateField} placeholder="Ej. Panama, Colombia, Estados Unidos" />
          </label>

          <label>
            {page.goalLabel}
            <textarea name="goal" value={form.goal} onChange={updateField} placeholder={page.goalPlaceholder} rows={3} required />
          </label>

          <div className="lead-form-row">
            <label>
              {page.budgetLabel}
              <input name="budget" value={form.budget} onChange={updateField} placeholder="Ej. 250k, hasta 1,500 mensual, ingresos 3k+" />
            </label>
            <label>
              Tiempo estimado
              <select name="timeline" value={form.timeline} onChange={updateField}>
                <option value="">Selecciona</option>
                <option>Lo antes posible</option>
                <option>En 30 dias</option>
                <option>En 3 meses</option>
                <option>Estoy investigando</option>
              </select>
            </label>
          </div>

          <label>
            {page.visitLabel}
            <select name="visit" value={form.visit} onChange={updateField}>
              <option value="">Selecciona</option>
              <option>Si, deseo coordinacion</option>
              <option>Prefiero llamada o videollamada</option>
              <option>No por ahora</option>
            </select>
          </label>

          <label>
            Detalles adicionales
            <textarea name="notes" value={form.notes} onChange={updateField} placeholder="Zonas, fechas, condiciones, dudas o comentarios." rows={3} />
          </label>

          {error ? <p className="form-error">{error}</p> : null}
          {status ? <p className="form-success">{status}</p> : null}

          <button className="primary" type="submit" disabled={sending}>
            {sending ? "Enviando..." : page.cta}
          </button>
          <small>
            Al enviar aceptas que PanAvisos comparta tu solicitud con un asesor aliado para dar seguimiento. La informacion
            es orientativa y no garantiza aprobaciones legales, bancarias, fiscales o migratorias.
          </small>
        </form>
      </section>

      <section className="lead-highlight-band">
        {page.highlights.map((item) => (
          <article key={item}>
            <span>✓</span>
            <p>{item}</p>
          </article>
        ))}
      </section>

      <section className="lead-content-grid">
        <div>
          <span className="eyebrow">Servicios</span>
          <h2>Como podemos ayudarte</h2>
          <ul className="lead-service-list">
            {page.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        <div className="lead-section-stack">
          {page.sections.map((section) => (
            <article className="lead-info-card" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      {page.references?.length ? (
        <section className="lead-references">
          <span className="eyebrow">Referencias oficiales</span>
          <p>
            Para temas fiscales, migratorios o de inversion usamos informacion general y verificable; cada caso debe
            evaluarse con un profesional.
          </p>
          <div>
            {page.references.map((reference) => (
              <a href={reference.url} key={reference.url} target="_blank" rel="noreferrer">
                {reference.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="lead-footer">
        <Link href="/">PanAvisos</Link>
        <Link href="/propiedades-en-panama">Propiedades en Panama</Link>
        <Link href="/asesoria-migratoria-legal">Legal y migracion</Link>
        <Link href="/asesoria-financiera">Asesoria financiera</Link>
      </footer>
    </main>
  );
}
