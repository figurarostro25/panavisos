"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { locationSuggestions } from "@/lib/locations";
import { money, provinces } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

function defaultExpiresAt() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

const emptyForm = {
  title: "",
  category_id: "",
  operation: "Venta",
  price: "",
  original_price: "",
  discount_percent: "",
  province: "Panama",
  district: "",
  address_reference: "",
  bedrooms: "",
  bathrooms: "",
  area_m2: "",
  description: "",
  whatsapp: "",
  email: "",
  website_url: "",
  expires_at: defaultExpiresAt(),
  images: []
};

export default function PublicarPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/catalog")
      .then((response) => response.json())
      .then((payload) => {
        const nextCategories = payload.categories || [];
        setCategories(nextCategories);
        setForm((current) => ({ ...current, category_id: current.category_id || nextCategories[0]?.id || "" }));
      });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await hydrateProfile(data.session);
      await loadEditableListing(data.session);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      hydrateProfile(nextSession);
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadEditableListing(nextSession) {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;

    setEditingId(editId);
    if (!nextSession?.access_token) {
      setError("Inicia sesion para editar este anuncio.");
      return;
    }

    const response = await fetch(`/api/account/listings/${editId}`, {
      headers: {
        Authorization: `Bearer ${nextSession.access_token}`
      }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || "No pudimos cargar ese anuncio.");
      return;
    }

    setForm(listingToForm(payload.listing));
  }

  async function hydrateProfile(nextSession) {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    const supabase = getSupabaseBrowser();
    const { data } = await supabase.from("profiles").select("*").eq("id", nextSession.user.id).maybeSingle();
    const metadata = nextSession.user.user_metadata || {};
    const nextProfile = {
      name: data?.full_name || metadata.full_name || metadata.name || nextSession.user.email,
      email: nextSession.user.email,
      phone: data?.phone || "",
      avatar: data?.avatar_url || metadata.avatar_url || metadata.picture || ""
    };

    setProfile(nextProfile);
    setForm((current) => ({
      ...current,
      whatsapp: current.whatsapp || nextProfile.phone || ""
    }));
  }

  const selectedCategory = categories.find((category) => category.id === form.category_id);
  const isRealEstate = selectedCategory?.slug === "bienes-raices";

  const locationMatches = useMemo(() => {
    const query = normalize(form.district);
    if (!query || query.length < 2) return [];
    const tokens = query.split(/\s+/).filter(Boolean);
    return locationSuggestions
      .map((location) => {
        const label = normalize(location.label);
        const district = normalize(location.district);
        const exact = district === query ? 0 : 10;
        const starts = district.startsWith(query) || label.startsWith(query) ? 1 : 10;
        const contains = label.includes(query) || district.includes(query) ? 2 : 10;
        const tokenMatch = tokens.every((token) => label.includes(token) || district.includes(token)) ? 3 : 10;
        return { location, rank: Math.min(exact, starts, contains, tokenMatch) };
      })
      .filter((item) => item.rank < 10)
      .sort((a, b) => a.rank - b.rank || a.location.label.localeCompare(b.location.label))
      .slice(0, 7)
      .map((item) => item.location);
  }, [form.district]);

  const currentStep = Math.min(step, 3);

  function setCategory(categoryId) {
    const nextCategory = categories.find((category) => category.id === categoryId);
    setForm({
      ...form,
      category_id: categoryId,
      bedrooms: nextCategory?.slug === "bienes-raices" ? form.bedrooms : "",
      bathrooms: nextCategory?.slug === "bienes-raices" ? form.bathrooms : "",
      area_m2: nextCategory?.slug === "bienes-raices" ? form.area_m2 : ""
    });
  }

  function applyDiscount(discountPercent) {
    const originalPrice = Number(form.original_price || 0);
    const nextPrice =
      originalPrice > 0 && Number(discountPercent) > 0
        ? Math.round(originalPrice * (1 - Number(discountPercent) / 100))
        : form.price;
    setForm({ ...form, discount_percent: discountPercent, price: nextPrice });
  }

  function chooseLocation(location) {
    setForm({
      ...form,
      province: location.province,
      district: location.district,
      address_reference: location.label
    });
    setLocationOpen(false);
  }

  function goNext() {
    setError("");
    if (currentStep === 1 && (!form.title || !form.price || !form.category_id || !form.description)) {
      setError("Completa titulo, precio, categoria y descripcion.");
      return;
    }

    if (currentStep === 1 && form.operation === "Oferta" && !form.expires_at) {
      setError("Las ofertas deben tener fecha de vigencia.");
      return;
    }

    if (currentStep === 2 && !form.district) {
      setError("Completa la ubicacion para continuar.");
      return;
    }

    if (currentStep === 2 && !session?.access_token) {
      setError("Inicia sesion con Google, Facebook o correo para publicar.");
      return;
    }

    setStep((value) => Math.min(3, value + 1));
  }

  async function uploadImages(files) {
    setSaving(true);
    setError("");
    if (!session?.access_token) {
      setSaving(false);
      setError("Inicia sesion antes de subir fotos.");
      return;
    }

    try {
      const nextImages = [];
      for (const file of Array.from(files || [])) {
        const signed = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`
          }
        }).then((response) => response.json());

        if (signed.error) throw new Error(signed.error);

        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signed.apiKey);
        body.append("timestamp", signed.timestamp);
        body.append("signature", signed.signature);
        body.append("folder", signed.folder);

        const uploaded = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: "POST", body }
        ).then((response) => response.json());

        if (uploaded.error) throw new Error(uploaded.error.message);
        nextImages.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
      }

      setForm((current) => ({ ...current, images: [...current.images, ...nextImages] }));
    } catch (uploadError) {
      setError(uploadError.message || "No se pudieron subir las imagenes.");
    } finally {
      setSaving(false);
    }
  }

  async function submitListing(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!session?.access_token) {
      setSaving(false);
      setError("Inicia sesion para publicar.");
      return;
    }

    const payload = {
      ...form,
      bedrooms: isRealEstate ? form.bedrooms : "",
      bathrooms: isRealEstate ? form.bathrooms : "",
      area_m2: isRealEstate ? form.area_m2 : "",
      advertiser_name: profile?.name || session.user.email,
      advertiser_email: session.user.email,
      advertiser_phone: form.whatsapp || "",
      whatsapp: form.whatsapp || ""
    };

    const response = await fetch(editingId ? `/api/account/listings/${editingId}` : "/api/public/listings", {
      method: editingId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`
      },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error || "No se pudo enviar la publicacion.");
      return;
    }

    setMessage(editingId ? "Cambios enviados. El anuncio queda pendiente de revision." : "Anuncio enviado. Queda pendiente de aprobacion.");
    if (!editingId) setForm({ ...emptyForm, category_id: categories[0]?.id || "" });
  }

  return (
    <>
      <header className="topbar marketplace-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">PA</span>
          <span>
            <strong>PanAvisos</strong>
            <small>Crear publicacion</small>
          </span>
        </Link>
        <nav className="top-actions">
          <Link href="/">Catalogo</Link>
          <Link href="/cuenta">Cuenta</Link>
        </nav>
      </header>

      <main className="publish-workspace">
        <form className="publish-form" onSubmit={submitListing}>
          <div className="publish-head">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h1>Articulo en venta</h1>
              {editingId ? <p className="muted">Editando publicacion existente</p> : null}
            </div>
          </div>

          <div className="step-meter" aria-label="Progreso">
            <span className={currentStep >= 1 ? "active" : ""} />
            <span className={currentStep >= 2 ? "active" : ""} />
            <span className={currentStep >= 3 ? "active" : ""} />
          </div>

          <p className="muted step-copy">
            {currentStep === 1 ? "Fotos y contenido del anuncio." : null}
            {currentStep === 2 ? "Ubicacion y datos de tu cuenta." : null}
            {currentStep === 3 ? "Revisa la vista previa y publica." : null}
          </p>

          {message ? <p className="notice">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}

          {currentStep === 1 ? (
            <div className="step-pane">
              <label className="upload-box">
                <input type="file" accept="image/*" multiple onChange={(event) => uploadImages(event.target.files)} />
                <strong>Anadir fotos</strong>
                <span>o arrastrar y soltar</span>
              </label>

              <label className="field">
                <span>Titulo</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Precio final</span>
                  <input required type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
                </label>
                <label className="field">
                  <span>Precio anterior</span>
                  <input type="number" value={form.original_price} onChange={(event) => setForm({ ...form, original_price: event.target.value })} />
                </label>
              </div>

              <label className="field">
                <span>Descuento %</span>
                <input type="number" min="0" max="99" value={form.discount_percent} onChange={(event) => applyDiscount(event.target.value)} />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Categoria</span>
                  <select required value={form.category_id} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select value={form.operation} onChange={(event) => setForm({ ...form, operation: event.target.value })}>
                    <option>Venta</option>
                    <option>Alquiler</option>
                    <option>Servicio</option>
                    <option>Oferta</option>
                  </select>
                </label>
              </div>

              {form.operation === "Oferta" ? (
                <label className="field">
                  <span>Vigencia de la oferta</span>
                  <input
                    required
                    type="date"
                    value={form.expires_at}
                    onChange={(event) => setForm({ ...form, expires_at: event.target.value })}
                  />
                </label>
              ) : null}

              {isRealEstate ? (
                <div className="field-row">
                  <label className="field">
                    <span>Recamaras</span>
                    <input type="number" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Banos</span>
                    <input type="number" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Area m2</span>
                    <input type="number" value={form.area_m2} onChange={(event) => setForm({ ...form, area_m2: event.target.value })} />
                  </label>
                </div>
              ) : null}

              <label className="field">
                <span>Descripcion</span>
                <textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>

              <label className="field">
                <span>Sitio web</span>
                <input type="url" value={form.website_url} onChange={(event) => setForm({ ...form, website_url: event.target.value })} placeholder="https://cliente.com" />
              </label>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="step-pane">
              <label className="field location-field">
                <span>Ubicacion</span>
                <input
                  required
                  value={form.district}
                  onChange={(event) => {
                    setForm({ ...form, district: event.target.value });
                    setLocationOpen(true);
                  }}
                  onFocus={() => setLocationOpen(true)}
                  placeholder="Ej: Parque Lefevre, Coronado..."
                />
                {locationOpen && locationMatches.length ? (
                  <div className="suggestion-list">
                    {locationMatches.map((location) => (
                      <button type="button" key={location.label} onClick={() => chooseLocation(location)}>
                        {location.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>

              <label className="field">
                <span>Provincia</span>
                <select value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })}>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>

              <div className="account-box">
                <h2>Cuenta del anunciante</h2>
                <p className="muted">
                  {profile
                    ? `Publicaras como ${profile.name}.`
                    : "Debes entrar con Google, Facebook o correo antes de publicar."}
                </p>
                <div className="account-actions">
                  <Link className="secondary" href="/cuenta">
                    {profile ? "Ver cuenta" : "Entrar o registrarme"}
                  </Link>
                </div>
              </div>

              <label className="field">
                <span>WhatsApp opcional</span>
                <input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="Ej: 6000-0000" />
              </label>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="step-pane">
              <div className="review-card">
              <h2>{editingId ? "Enviar cambios" : "Publicar en PanAvisos"}</h2>
              <p className="muted">Tu anuncio quedara pendiente de aprobacion. No se borra lo que llenaste si vuelves atras.</p>
                <div className="review-row">
                  <span>Titulo</span>
                  <strong>{form.title || "Sin titulo"}</strong>
                </div>
                <div className="review-row">
                  <span>Precio</span>
                  <strong>{money(form.price)}</strong>
                </div>
                <div className="review-row">
                  <span>Ubicacion</span>
                  <strong>{form.district || "Sin ubicacion"}</strong>
                </div>
                {form.operation === "Oferta" ? (
                  <div className="review-row">
                    <span>Vigencia</span>
                    <strong>{form.expires_at}</strong>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="publish-bottom-bar">
            <button className="secondary" type="button" disabled={currentStep === 1 || saving} onClick={() => setStep((value) => Math.max(1, value - 1))}>
              Anterior
            </button>
            {currentStep < 3 ? (
              <button className="primary" type="button" onClick={goNext} disabled={saving}>
                Siguiente
              </button>
            ) : (
              <button className="primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar"}
              </button>
            )}
          </div>

        </form>

        <section className="publish-preview">
          <h2>Vista previa</h2>
          <div className="preview-shell">
            <div className="preview-media">
              {form.images[0]?.url ? <img src={form.images[0].url} alt="" /> : <span>Vista previa de la publicacion</span>}
            </div>
            <aside className="preview-info">
              <h3>{form.title || "Titulo"}</h3>
              <PriceBlock listing={form} />
              <p className="muted">Publicado hace unos segundos en {form.district || "Ciudad de Panama"}</p>
              <h4>Detalles</h4>
              <p>{form.description || "La descripcion aparecera aqui."}</p>
              <h4>Informacion del vendedor</h4>
              <p>{profile?.name || "Tu cuenta"}</p>
              <button className="primary" type="button" disabled>
                Enviar mensaje
              </button>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function PriceBlock({ listing }) {
  const hasDiscount = Number(listing.original_price) > Number(listing.price || 0);
  return (
    <div className="price-stack">
      {hasDiscount ? <span className="old-price">{money(listing.original_price)}</span> : null}
      <strong className="price">{money(listing.price)}</strong>
      {hasDiscount && listing.discount_percent ? <span className="discount-badge">{listing.discount_percent}% menos</span> : null}
    </div>
  );
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function listingToForm(listing) {
  const images = [...(listing.images || [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({ url: image.url, public_id: image.public_id }));

  return {
    ...emptyForm,
    title: listing.title || "",
    category_id: listing.category_id || "",
    operation: listing.operation || "Venta",
    price: listing.price ?? "",
    original_price: listing.original_price ?? "",
    discount_percent: listing.discount_percent ?? "",
    province: listing.province || "Panama",
    district: listing.district || "",
    address_reference: listing.address_reference || "",
    bedrooms: listing.bedrooms || "",
    bathrooms: listing.bathrooms || "",
    area_m2: listing.area_m2 || "",
    description: listing.description || "",
    whatsapp: listing.whatsapp || "",
    email: listing.email || "",
    website_url: listing.website_url || "",
    expires_at: listing.expires_at ? String(listing.expires_at).slice(0, 10) : defaultExpiresAt(),
    images
  };
}
