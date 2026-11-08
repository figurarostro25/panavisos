"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { provinces } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

const initialForm = {
  requestType: "property",
  name: "",
  email: "",
  phone: "",
  province: "Panama",
  area: "",
  radius: "5 km",
  budgetMin: "",
  budgetMax: "",
  categoryId: "",
  target: "",
  salary: "",
  skills: "",
  loanAmount: "",
  loanPurpose: "",
  monthlyIncome: "",
  workStatus: "",
  collateral: "",
  notes: "",
  consent: false,
  publicConsent: false
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
  const [session, setSession] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isLoan) return;
    const supabase = getSupabaseBrowser();
    async function applySession(nextSession) {
      setSession(nextSession);
      if (!nextSession?.user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name,phone").eq("id", nextSession.user.id).maybeSingle();
      setForm((current) => ({
        ...current,
        name: current.name || profile?.full_name || nextSession.user.user_metadata?.full_name || nextSession.user.user_metadata?.name || "",
        phone: current.phone || profile?.phone || "",
        email: current.email || nextSession.user.email || ""
      }));
    }
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));
    fetch("/api/catalog")
      .then((response) => response.json())
      .then((payload) => setCategories(Array.isArray(payload.categories) ? payload.categories : []))
      .catch(() => setCategories([]));
    try {
      const draft = sessionStorage.getItem("panavisos-search-draft");
      if (draft) setForm((current) => ({ ...current, ...JSON.parse(draft) }));
    } catch {}
    return () => listener.subscription.unsubscribe();
  }, [isLoan]);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "requestType" ? { categoryId: "" } : {})
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isLoan && (!form.loanAmount.trim() || !form.loanPurpose.trim())) {
      setError("Indica el monto aproximado y para qué necesitas el financiamiento.");
      return;
    }

    if (isLoan && (!form.name.trim() || !form.email.includes("@") || !form.phone.trim() || !form.consent)) {
      setError("Completa nombre, correo, WhatsApp y acepta el seguimiento de esta solicitud.");
      return;
    }

    const typeLabel = requestTypes.find((item) => item.value === form.requestType)?.label || "Otro";
    if (!isLoan) {
      const categoryId = form.categoryId || defaultCategoryId(categories, form.requestType);
      if (!form.target.trim() || !categoryId || !form.name.trim() || !form.phone.trim()) {
        setError("Completa qué buscas, categoría, nombre y WhatsApp.");
        return;
      }
      if (!form.publicConsent) {
        setError("Confirma que autorizas publicar esta búsqueda y mostrar el nombre y WhatsApp indicados.");
        return;
      }
      if (!session?.access_token) {
        try { sessionStorage.setItem("panavisos-search-draft", JSON.stringify(form)); } catch {}
        window.location.href = `/cuenta?next=${encodeURIComponent("/yo-busco?publicar=1")}&mode=register`;
        return;
      }

      const budgetMin = numericBudget(form.budgetMin);
      const budgetMax = numericBudget(form.budgetMax);
      if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
        setError("El presupuesto mínimo no puede superar el máximo.");
        return;
      }

      const target = form.target.trim();
      const listingTitle = /^(busco|buscamos|necesito|necesitamos)\b/i.test(target) ? target : `Busco ${target}`;
      const location = form.area.trim() || (form.radius === "Todo Panamá" ? "Todo Panamá" : form.province);
      const description = [
        `Tipo de búsqueda: ${typeLabel}`,
        `Qué busca: ${target}`,
        `Provincia: ${form.province}`,
        `Zona preferida: ${form.area.trim() || "Sin preferencia específica"}`,
        `Radio: ${form.radius}`,
        `Presupuesto: ${formatBudget(budgetMin, budgetMax)}`,
        ...(form.requestType === "job" ? [`Salario esperado: ${form.salary.trim() || "No indicado"}`, `Experiencia o cualidades: ${form.skills.trim() || "No indicadas"}`] : []),
        `Detalles adicionales: ${form.notes.trim() || "Ninguno"}`
      ].join("\n");

      setSending(true);
      try {
        const response = await fetch("/api/public/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            title: listingTitle.slice(0, 160),
            category_id: categoryId,
            operation: "Busco",
            price: budgetMax ?? budgetMin ?? 0,
            budget_min: budgetMin,
            budget_max: budgetMax,
            province: form.province,
            district: location,
            address_reference: form.area.trim() || null,
            description,
            whatsapp: form.phone.trim(),
            advertiser_name: form.name.trim(),
            advertiser_phone: form.phone.trim(),
            advertiser_email: session.user.email,
            responsibility_accepted: true,
            public_contact_consent: true,
            featured: false
          })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "No pudimos publicar tu búsqueda.");
        try { sessionStorage.removeItem("panavisos-search-draft"); } catch {}
        window.location.href = "/cuenta?published=search";
      } catch (nextError) {
        setError(nextError.message);
      } finally {
        setSending(false);
      }
      return;
    }

    if (!form.name.trim() || !form.email.includes("@") || !form.phone.trim() || !form.consent) {
      setError("Completa nombre, correo, WhatsApp y acepta el seguimiento de esta solicitud.");
      return;
    }
    const lines = [
          "Segmento: Préstamos y refinanciamiento",
          `Monto aproximado: ${form.loanAmount}`,
          `Objetivo: ${form.loanPurpose}`,
          `Ingreso mensual aproximado: ${form.monthlyIncome || "No indicado"}`,
          `Situación laboral: ${form.workStatus || "No indicada"}`,
          `Garantía disponible: ${form.collateral || "No indicada"}`,
          `Provincia: ${form.province}`,
          `Notas: ${form.notes || "Sin notas adicionales"}`
        ];

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "loan_request",
          subject: "Solicitud de préstamo o refinanciamiento",
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
              : "Publica lo que necesitas encontrar para que quienes tengan una opción puedan descubrirte y contactarte."}
          </p>
          <ul>
            <li>Tu búsqueda aparece como un anuncio público.</li>
            <li>Incluye ubicación y presupuesto para recibir opciones relevantes.</li>
            <li>Administra o retira tu publicación desde tu cuenta.</li>
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
            <h2>{isLoan ? "Solicitud de orientación" : "Publicar mi búsqueda"}</h2>
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
          {isLoan ? <label>Correo electrónico<input name="email" type="email" value={form.email} onChange={update} required /></label> : <p className="muted">Publicarás con tu cuenta de PanAvisos. Tu correo no se mostrará en el anuncio.</p>}

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
              <label>Categoría<select value={form.categoryId || defaultCategoryId(categories, form.requestType)} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required><option value="">Selecciona categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <div className="request-form-row">
                <label>Provincia<select name="province" value={form.province} onChange={update}>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
                <label>Zona preferida<input name="area" value={form.area} onChange={update} placeholder="Ej. 12 de Octubre" /></label>
              </div>
              <div className="request-form-row">
                <label>Presupuesto mínimo (USD)<input name="budgetMin" type="number" min="0" value={form.budgetMin} onChange={update} placeholder="Opcional" /></label>
                <label>Presupuesto máximo (USD)<input name="budgetMax" type="number" min="0" value={form.budgetMax} onChange={update} placeholder="Ej. 700" /></label>
              </div>
              <div className="request-form-row">
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
          {isLoan ? <label className="request-consent"><input type="checkbox" name="consent" checked={form.consent} onChange={update} /><span>Acepto que PanAvisos y un asesor aliado me contacten para dar seguimiento a esta solicitud.</span></label> : <label className="request-consent"><input type="checkbox" name="publicConsent" checked={form.publicConsent} onChange={update} /><span>Autorizo publicar esta búsqueda y mostrar públicamente mi nombre y WhatsApp para recibir propuestas. Podré editarla o retirarla desde mi cuenta.</span></label>}

          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
          {!isLoan && !session?.access_token ? <p className="notice">Para publicar y administrar tu búsqueda necesitas una cuenta. Si aún no has iniciado sesión, te llevaremos al acceso sin perder lo que escribiste.</p> : null}
          <button className="primary" type="submit" disabled={sending}>{sending ? "Publicando..." : isLoan ? "Enviar solicitud" : "Publicar mi búsqueda"}</button>
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

function numericBudget(value) {
  if (String(value || "").trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatBudget(min, max) {
  if (min == null && max == null) return "Sin presupuesto indicado";
  if (min != null && max != null) return `USD ${min} a ${max}`;
  if (max != null) return `Hasta USD ${max}`;
  return `Desde USD ${min}`;
}

function defaultCategoryId(categories, type) {
  const candidateSlugs = {
    property: ["bienes-raices", "propiedades", "inmuebles"],
    job: ["empleos", "hojas-de-vida", "trabajo"],
    vehicle: ["autos", "vehiculos", "vehículos"],
    service: ["servicios", "servicios-profesionales"],
    product: ["marketplace", "productos"],
    other: ["otros"]
  }[type] || [];
  for (const slug of candidateSlugs) {
    const match = categories.find((category) => normalizeText(category.slug) === normalizeText(slug));
    if (match) return match.id;
  }
  const terms = {
    property: ["propiedad", "inmueble", "raiz"],
    job: ["empleo", "trabajo"],
    vehicle: ["auto", "vehiculo", "carro"],
    service: ["servicio"],
    product: ["producto", "marketplace"],
    other: ["otro"]
  }[type] || [];
  return categories.find((category) => terms.some((term) => normalizeText(`${category.slug} ${category.name}`).includes(normalizeText(term))))?.id || "";
}

function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
