"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { locationSuggestions } from "@/lib/locations";
import { money, provinces } from "@/lib/format";

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
  advertiser_name: "",
  advertiser_phone: "",
  advertiser_email: "",
  expires_at: defaultExpiresAt(),
  images: []
};

export default function PublicarPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
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

  const selectedCategory = categories.find((category) => category.id === form.category_id);
  const isRealEstate = selectedCategory?.slug === "bienes-raices";

  const locationMatches = useMemo(() => {
    const query = normalize(form.district);
    if (!query || query.length < 2) return [];
    return locationSuggestions
      .filter((location) => normalize(location.label).includes(query) || normalize(location.district).includes(query))
      .slice(0, 5);
  }, [form.district, form.address_reference]);

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
  }

  async function uploadImages(files) {
    setSaving(true);
    setError("");
    try {
      const nextImages = [];
      for (const file of Array.from(files || [])) {
        const signed = await fetch("/api/cloudinary/sign", { method: "POST" }).then((response) =>
          response.json()
        );

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

    const payload = {
      ...form,
      bedrooms: isRealEstate ? form.bedrooms : "",
      bathrooms: isRealEstate ? form.bathrooms : "",
      area_m2: isRealEstate ? form.area_m2 : "",
      whatsapp: form.whatsapp || form.advertiser_phone
    };

    const response = await fetch("/api/public/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error || "No se pudo enviar la publicacion.");
      return;
    }

    setMessage("Anuncio enviado. Queda pendiente de aprobacion.");
    setForm({ ...emptyForm, category_id: categories[0]?.id || "" });
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
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <main className="publish-workspace">
        <form className="publish-form" onSubmit={submitListing}>
          <div className="publish-head">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h1>Articulo en venta</h1>
            </div>
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Enviando..." : "Enviar"}
            </button>
          </div>

          {message ? <p className="notice">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}

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

          <label className="field location-field">
            <span>Ubicacion</span>
            <input required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="Ej: Parque Lefevre, Coronado..." />
            {locationMatches.length ? (
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

          <label className="field">
            <span>Descripcion</span>
            <textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>

          <label className="field">
            <span>Sitio web</span>
            <input type="url" value={form.website_url} onChange={(event) => setForm({ ...form, website_url: event.target.value })} placeholder="https://cliente.com" />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Tu nombre</span>
              <input required value={form.advertiser_name} onChange={(event) => setForm({ ...form, advertiser_name: event.target.value })} />
            </label>
            <label className="field">
              <span>WhatsApp</span>
              <input required value={form.advertiser_phone} onChange={(event) => setForm({ ...form, advertiser_phone: event.target.value, whatsapp: event.target.value })} />
            </label>
          </div>

          <label className="field">
            <span>Email opcional</span>
            <input type="email" value={form.advertiser_email} onChange={(event) => setForm({ ...form, advertiser_email: event.target.value, email: event.target.value })} />
          </label>
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
              <p>{form.advertiser_name || "Nombre del anunciante"}</p>
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
