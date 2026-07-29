"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money, provinces } from "@/lib/format";

const emptyListing = {
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
  advertiser_age: "",
  lat: "",
  lng: "",
  status: "active",
  featured: false,
  expires_at: "",
  images: []
};

const emptyBanner = {
  title: "",
  subtitle: "",
  cta_label: "",
  cta_url: "",
  image_url: "",
  placement: "home",
  status: "active",
  sort_order: 0,
  starts_at: "",
  ends_at: ""
};

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", description: "", sort_order: 0 });
  const [listingForm, setListingForm] = useState(emptyListing);
  const [bannerForm, setBannerForm] = useState(emptyBanner);
  const [listingFilter, setListingFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdmin().finally(() => setReady(true));
  }, []);

  async function loadAdmin() {
    const [catResponse, listingResponse, bannerResponse] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/listings"),
      fetch("/api/admin/banners")
    ]);

    if (catResponse.status === 401 || listingResponse.status === 401 || bannerResponse.status === 401) {
      setLoggedIn(false);
      return;
    }

    const catData = await catResponse.json();
    const listingData = await listingResponse.json();
    const bannerData = await bannerResponse.json();
    setCategories(catData.categories || []);
    setListings(listingData.listings || []);
    setBanners(bannerData.banners || []);
    setLoggedIn(true);
  }

  async function login(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setError("Clave incorrecta o no configurada.");
      return;
    }

    setPassword("");
    await loadAdmin();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
  }

  async function saveCategory(event) {
    event.preventDefault();
    setSaving(true);
    const method = categoryForm.id ? "PATCH" : "POST";
    const url = categoryForm.id ? `/api/admin/categories/${categoryForm.id}` : "/api/admin/categories";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm)
    });
    setSaving(false);

    if (!response.ok) {
      setError("No se pudo guardar la categoria.");
      return;
    }

    setCategoryForm({ id: "", name: "", description: "", sort_order: 0 });
    await loadAdmin();
  }

  async function deleteCategory(id) {
    if (!confirm("Eliminar esta categoria?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    await loadAdmin();
  }

  async function saveBanner(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const method = bannerForm.id ? "PATCH" : "POST";
    const url = bannerForm.id ? `/api/admin/banners/${bannerForm.id}` : "/api/admin/banners";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bannerForm)
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo guardar el banner.");
      return;
    }

    setBannerForm(emptyBanner);
    await loadAdmin();
  }

  async function deleteBanner(id) {
    if (!confirm("Eliminar este banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    await loadAdmin();
  }

  async function saveListing(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const method = listingForm.id ? "PATCH" : "POST";
    const url = listingForm.id ? `/api/admin/listings/${listingForm.id}` : "/api/admin/listings";
    const category = categories.find((item) => item.id === listingForm.category_id);
    const isListingRealEstate = category?.slug === "bienes-raices";
    const payload = {
      ...listingForm,
      bedrooms: isListingRealEstate ? listingForm.bedrooms : "",
      bathrooms: isListingRealEstate ? listingForm.bathrooms : "",
      area_m2: isListingRealEstate ? listingForm.area_m2 : ""
    };
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo guardar el anuncio.");
      return;
    }

    setListingForm({ ...emptyListing, category_id: categories[0]?.id || "" });
    await loadAdmin();
  }

  async function deleteListing(id) {
    if (!confirm("Eliminar este anuncio?")) return;
    await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    await loadAdmin();
  }

  async function quickUpdateListing(listing, changes) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...listing,
        ...changes,
        images: listing.images || []
      })
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo actualizar el anuncio.");
      return;
    }

    await loadAdmin();
  }

  function editListing(listing) {
    setListingForm({
      id: listing.id,
      title: listing.title || "",
      category_id: listing.category_id || "",
      operation: listing.operation || "Venta",
      price: listing.price || "",
      original_price: listing.original_price || "",
      discount_percent: listing.discount_percent || "",
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
      advertiser_name: listing.advertiser_name || "",
      advertiser_phone: listing.advertiser_phone || "",
      advertiser_email: listing.advertiser_email || "",
      advertiser_age: listing.advertiser_age || "",
      lat: listing.lat || "",
      lng: listing.lng || "",
      status: listing.status || "active",
      featured: Boolean(listing.featured),
      expires_at: toDateInput(listing.expires_at),
      images: (listing.images || []).sort((a, b) => a.position - b.position)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImages(files) {
    setSaving(true);
    setError("");
    try {
      const nextImages = [];
      for (const file of Array.from(files)) {
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

        nextImages.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id
        });
      }

      setListingForm((current) => ({ ...current, images: [...current.images, ...nextImages] }));
    } catch (uploadError) {
      setError(uploadError.message || "No se pudieron subir las imagenes.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadBannerImage(files) {
    const file = Array.from(files || [])[0];
    if (!file) return;

    setSaving(true);
    setError("");
    try {
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

      setBannerForm((current) => ({ ...current, image_url: uploaded.secure_url }));
    } catch (uploadError) {
      setError(uploadError.message || "No se pudo subir la imagen del banner.");
    } finally {
      setSaving(false);
    }
  }

  function updateProvince(province) {
    setListingForm((current) => ({
      ...current,
      province
    }));
  }

  useEffect(() => {
    if (categories.length && !listingForm.category_id) {
      setListingForm((current) => ({ ...current, category_id: categories[0].id }));
    }
  }, [categories, listingForm.category_id]);

  const selectedCategory = categories.find((category) => category.id === listingForm.category_id);
  const isRealEstate = selectedCategory?.slug === "bienes-raices";
  const listingStats = {
    total: listings.length,
    active: listings.filter((listing) => listing.status === "active").length,
    pending: listings.filter((listing) => listing.status === "pending").length,
    paused: listings.filter((listing) => listing.status === "paused").length,
    featured: listings.filter((listing) => listing.featured).length
  };
  const filteredListings =
    listingFilter === "all"
      ? listings
      : listingFilter === "featured"
        ? listings.filter((listing) => listing.featured)
        : listings.filter((listing) => listing.status === listingFilter);
  const advertisers = groupAdvertisers(listings);

  function applyDiscount(discountPercent) {
    const originalPrice = Number(listingForm.original_price || 0);
    const nextPrice =
      originalPrice > 0 && Number(discountPercent) > 0
        ? Math.round(originalPrice * (1 - Number(discountPercent) / 100))
        : listingForm.price;
    setListingForm({ ...listingForm, discount_percent: discountPercent, price: nextPrice });
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">PA</span>
          <span>
            <strong>PanAvisos</strong>
            <small>Admin real</small>
          </span>
        </Link>
        <div className="admin-actions">
          <Link className="nav-link" href="/">
            Catalogo
          </Link>
          {loggedIn ? (
            <button className="secondary" type="button" onClick={logout}>
              Salir
            </button>
          ) : null}
        </div>
      </header>

      <main className="admin-shell">
        <div className="admin-title">
          <div>
            <h1>Panel admin</h1>
            <p className="muted">Dashboard para aprobar, pausar, destacar y revisar publicaciones.</p>
          </div>
        </div>

        {!ready ? <div className="notice">Cargando...</div> : null}

        {ready && !loggedIn ? (
          <form className="login" onSubmit={login}>
            <h2>Entrar</h2>
            <p className="muted">Usa la clave definida en Vercel como PANAVISOS_ADMIN_PASSWORD.</p>
            <label className="field">
              <span>Clave admin</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="primary" type="submit">
              Entrar
            </button>
          </form>
        ) : null}

        {ready && loggedIn ? (
          <>
            <section className="admin-metrics">
              <button className={`stat ${listingFilter === "all" ? "selected" : ""}`} type="button" onClick={() => setListingFilter("all")}>
                <span>Total anuncios</span>
                <strong>{listingStats.total}</strong>
              </button>
              <button className={`stat ${listingFilter === "pending" ? "selected" : ""}`} type="button" onClick={() => setListingFilter("pending")}>
                <span>Pendientes</span>
                <strong>{listingStats.pending}</strong>
              </button>
              <button className={`stat ${listingFilter === "active" ? "selected" : ""}`} type="button" onClick={() => setListingFilter("active")}>
                <span>Activos</span>
                <strong>{listingStats.active}</strong>
              </button>
              <button className={`stat ${listingFilter === "featured" ? "selected" : ""}`} type="button" onClick={() => setListingFilter("featured")}>
                <span>Destacados</span>
                <strong>{listingStats.featured}</strong>
              </button>
              <button className={`stat ${listingFilter === "paused" ? "selected" : ""}`} type="button" onClick={() => setListingFilter("paused")}>
                <span>Pausados</span>
                <strong>{listingStats.paused}</strong>
              </button>
            </section>

            <div className="admin-grid">
            <section className="panel">
              <div className="form-head">
                <h2>{listingForm.id ? "Editar anuncio" : "Nuevo anuncio"}</h2>
                <button className="secondary" type="button" onClick={() => setListingForm(emptyListing)}>
                  Limpiar
                </button>
              </div>
              {error ? <p className="error">{error}</p> : null}
              <form onSubmit={saveListing}>
                <div className="field-row">
                  <label className="field">
                    <span>Titulo</span>
                    <input
                      required
                      value={listingForm.title}
                      onChange={(event) => setListingForm({ ...listingForm, title: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Categoria</span>
                    <select
                      required
                      value={listingForm.category_id}
                      onChange={(event) => {
                        const nextCategory = categories.find((category) => category.id === event.target.value);
                        setListingForm({
                          ...listingForm,
                          category_id: event.target.value,
                          bedrooms: nextCategory?.slug === "bienes-raices" ? listingForm.bedrooms : "",
                          bathrooms: nextCategory?.slug === "bienes-raices" ? listingForm.bathrooms : "",
                          area_m2: nextCategory?.slug === "bienes-raices" ? listingForm.area_m2 : ""
                        });
                      }}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-row">
                  <label className="field">
                    <span>Tipo</span>
                    <select
                      value={listingForm.operation}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, operation: event.target.value })
                      }
                    >
                      <option>Venta</option>
                      <option>Alquiler</option>
                      <option>Servicio</option>
                      <option>Oferta</option>
                      <option>Promocion</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Precio final USD</span>
                    <input
                      required
                      type="number"
                      value={listingForm.price}
                      onChange={(event) => setListingForm({ ...listingForm, price: event.target.value })}
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label className="field">
                    <span>Precio anterior</span>
                    <input
                      type="number"
                      value={listingForm.original_price}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, original_price: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Descuento %</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={listingForm.discount_percent}
                      onChange={(event) => applyDiscount(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Vence</span>
                    <input
                      type="date"
                      value={listingForm.expires_at}
                      onChange={(event) => setListingForm({ ...listingForm, expires_at: event.target.value })}
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label className="field">
                    <span>Provincia</span>
                    <select
                      value={listingForm.province}
                      onChange={(event) => updateProvince(event.target.value)}
                    >
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Distrito o zona</span>
                    <input
                      required
                      value={listingForm.district}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, district: event.target.value })
                      }
                    />
                  </label>
                </div>

                {isRealEstate ? (
                  <div className="field-row">
                    <label className="field">
                      <span>Recamaras</span>
                      <input
                        type="number"
                        value={listingForm.bedrooms}
                        onChange={(event) =>
                          setListingForm({ ...listingForm, bedrooms: event.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Banos</span>
                      <input
                        type="number"
                        value={listingForm.bathrooms}
                        onChange={(event) =>
                          setListingForm({ ...listingForm, bathrooms: event.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Area m2</span>
                      <input
                        type="number"
                        value={listingForm.area_m2}
                        onChange={(event) =>
                          setListingForm({ ...listingForm, area_m2: event.target.value })
                        }
                      />
                    </label>
                  </div>
                ) : null}

                <label className="field">
                  <span>Descripcion</span>
                  <textarea
                    required
                    rows={5}
                    value={listingForm.description}
                    onChange={(event) =>
                      setListingForm({ ...listingForm, description: event.target.value })
                    }
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>WhatsApp</span>
                    <input
                      value={listingForm.whatsapp}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, whatsapp: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={listingForm.email}
                      onChange={(event) => setListingForm({ ...listingForm, email: event.target.value })}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Sitio web del cliente</span>
                  <input
                    type="url"
                    value={listingForm.website_url}
                    onChange={(event) => setListingForm({ ...listingForm, website_url: event.target.value })}
                    placeholder="https://cliente.com"
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Nombre del anunciante</span>
                    <input
                      value={listingForm.advertiser_name}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, advertiser_name: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Telefono anunciante</span>
                    <input
                      value={listingForm.advertiser_phone}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, advertiser_phone: event.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label className="field">
                    <span>Email anunciante</span>
                    <input
                      type="email"
                      value={listingForm.advertiser_email}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, advertiser_email: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Edad</span>
                    <input
                      type="number"
                      min="18"
                      value={listingForm.advertiser_age}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, advertiser_age: event.target.value })
                      }
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Referencia de ubicacion</span>
                  <input
                    value={listingForm.address_reference}
                    onChange={(event) =>
                      setListingForm({ ...listingForm, address_reference: event.target.value })
                    }
                    placeholder="Ej: Parque Lefevre, cerca de Via Espana"
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Latitud opcional</span>
                    <input
                      value={listingForm.lat}
                      onChange={(event) => setListingForm({ ...listingForm, lat: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Longitud opcional</span>
                    <input
                      value={listingForm.lng}
                      onChange={(event) => setListingForm({ ...listingForm, lng: event.target.value })}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Imagenes</span>
                  <input type="file" accept="image/*" multiple onChange={(event) => uploadImages(event.target.files)} />
                </label>
                <div className="image-preview">
                  {listingForm.images.map((image, index) => (
                    <button
                      className="secondary"
                      type="button"
                      key={`${image.url}-${index}`}
                      onClick={() =>
                        setListingForm({
                          ...listingForm,
                          images: listingForm.images.filter((_, itemIndex) => itemIndex !== index)
                        })
                      }
                    >
                      <img src={image.url} alt={`Imagen ${index + 1}`} />
                    </button>
                  ))}
                </div>

                <div className="switch-row">
                  <label className="field">
                    <span>Estado</span>
                    <select
                      value={listingForm.status}
                      onChange={(event) => setListingForm({ ...listingForm, status: event.target.value })}
                    >
                      <option value="active">Activo</option>
                      <option value="paused">Pausado</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Destacado</span>
                    <select
                      value={listingForm.featured ? "yes" : "no"}
                      onChange={(event) =>
                        setListingForm({ ...listingForm, featured: event.target.value === "yes" })
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Si</option>
                    </select>
                  </label>
                </div>

                <button className="primary" type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar anuncio"}
                </button>
              </form>
            </section>

            <aside className="panel">
              <div className="form-head">
                <h2>Anuncios</h2>
                <span className="pill">{filteredListings.length}</span>
              </div>
              <div className="list">
                {filteredListings.map((listing) => (
                  <article className="list-item" key={listing.id}>
                    <div className="list-title-row">
                      <h3>{listing.title}</h3>
                      <span className={`status-badge ${listing.status}`}>{statusLabel(listing.status)}</span>
                    </div>
                    <p className="muted">
                      {money(listing.price)} - {listing.category?.name || "Sin categoria"} - {listing.province}
                    </p>
                    <p className="muted">
                      {listing.profile?.full_name || listing.advertiser_name || "Admin"}
                      {listing.profile?.phone || listing.advertiser_phone ? ` - ${listing.profile?.phone || listing.advertiser_phone}` : ""}
                      {listing.advertiser_email ? ` - ${listing.advertiser_email}` : ""}
                      {listing.profile?.age || listing.advertiser_age ? ` - ${listing.profile?.age || listing.advertiser_age} anos` : ""}
                      {listing.expires_at ? ` - vence ${toDateInput(listing.expires_at)}` : ""}
                    </p>
                    <div className="quick-actions">
                      <button className="secondary" type="button" disabled={saving} onClick={() => quickUpdateListing(listing, { status: "active" })}>
                        Activar
                      </button>
                      <button className="secondary" type="button" disabled={saving} onClick={() => quickUpdateListing(listing, { status: "paused" })}>
                        Pausar
                      </button>
                      <button className="secondary" type="button" disabled={saving} onClick={() => quickUpdateListing(listing, { status: "pending" })}>
                        Pendiente
                      </button>
                      <button className="secondary" type="button" disabled={saving} onClick={() => quickUpdateListing(listing, { featured: !listing.featured })}>
                        {listing.featured ? "Quitar destacado" : "Destacar"}
                      </button>
                      <button className="secondary" type="button" onClick={() => editListing(listing)}>
                        Editar
                      </button>
                      <button className="danger" type="button" onClick={() => deleteListing(listing.id)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
                {!filteredListings.length ? <p className="muted">No hay anuncios en este filtro.</p> : null}
              </div>
            </aside>

            <aside className="panel admin-full-row">
              <div className="form-head">
                <h2>Anunciantes</h2>
                <span className="pill">{advertisers.length}</span>
              </div>
              <div className="advertiser-grid">
                {advertisers.map((advertiser) => (
                  <article className="advertiser-card" key={advertiser.key}>
                    <div className="avatar small-avatar">{initials(advertiser.name || advertiser.email || advertiser.phone)}</div>
                    <div>
                      <h3>{advertiser.name || "Sin nombre"}</h3>
                      <p className="muted">{advertiser.email || "Sin correo"}</p>
                      <p className="muted">
                        {advertiser.phone || "Sin telefono"}
                        {advertiser.age ? ` - ${advertiser.age} anos` : ""}
                      </p>
                      <div className="facts">
                        <span className="fact">Cuenta {advertiser.status}</span>
                        <span className="fact">{advertiser.total} anuncios</span>
                        <span className="fact">{advertiser.active} activos</span>
                        <span className="fact">{advertiser.pending} pendientes</span>
                        <span className="fact">{advertiser.featured} destacados</span>
                      </div>
                    </div>
                  </article>
                ))}
                {!advertisers.length ? <p className="muted">Todavia no hay anunciantes registrados.</p> : null}
              </div>
            </aside>

            <section className="panel">
              <div className="form-head">
                <h2>{bannerForm.id ? "Editar banner" : "Nuevo banner de portada"}</h2>
                <button className="secondary" type="button" onClick={() => setBannerForm(emptyBanner)}>
                  Limpiar
                </button>
              </div>
              <form onSubmit={saveBanner}>
                <label className="field">
                  <span>Titulo</span>
                  <input
                    required
                    value={bannerForm.title}
                    onChange={(event) => setBannerForm({ ...bannerForm, title: event.target.value })}
                    placeholder="Ej: Publica tu propiedad destacada"
                  />
                </label>
                <label className="field">
                  <span>Texto secundario</span>
                  <input
                    value={bannerForm.subtitle}
                    onChange={(event) => setBannerForm({ ...bannerForm, subtitle: event.target.value })}
                    placeholder="Una frase corta para el banner"
                  />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Texto del boton</span>
                    <input
                      value={bannerForm.cta_label}
                      onChange={(event) => setBannerForm({ ...bannerForm, cta_label: event.target.value })}
                      placeholder="Ver promocion"
                    />
                  </label>
                  <label className="field">
                    <span>Link del boton</span>
                    <input
                      value={bannerForm.cta_url}
                      onChange={(event) => setBannerForm({ ...bannerForm, cta_url: event.target.value })}
                      placeholder="/admin o https://..."
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Imagen del banner</span>
                  <input type="file" accept="image/*" onChange={(event) => uploadBannerImage(event.target.files)} />
                </label>
                <label className="field">
                  <span>URL de imagen</span>
                  <input
                    value={bannerForm.image_url}
                    onChange={(event) => setBannerForm({ ...bannerForm, image_url: event.target.value })}
                    placeholder="Se llena al subir imagen, o pega una URL"
                  />
                </label>
                {bannerForm.image_url ? (
                  <div className="banner-preview">
                    <img src={bannerForm.image_url} alt="" />
                  </div>
                ) : null}
                <div className="field-row">
                  <label className="field">
                    <span>Orden</span>
                    <input
                      type="number"
                      value={bannerForm.sort_order}
                      onChange={(event) => setBannerForm({ ...bannerForm, sort_order: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Estado</span>
                    <select
                      value={bannerForm.status}
                      onChange={(event) => setBannerForm({ ...bannerForm, status: event.target.value })}
                    >
                      <option value="active">Activo</option>
                      <option value="paused">Pausado</option>
                    </select>
                  </label>
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>Fecha inicio</span>
                    <input
                      type="date"
                      value={bannerForm.starts_at ? toDateInput(bannerForm.starts_at) : ""}
                      onChange={(event) => setBannerForm({ ...bannerForm, starts_at: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Fecha final</span>
                    <input
                      type="date"
                      value={bannerForm.ends_at ? toDateInput(bannerForm.ends_at) : ""}
                      onChange={(event) => setBannerForm({ ...bannerForm, ends_at: event.target.value })}
                    />
                  </label>
                </div>
                <button className="primary" type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar banner"}
                </button>
              </form>
            </section>

            <aside className="panel">
              <h2>Banners de portada</h2>
              <div className="list">
                {banners.map((banner) => (
                  <article className="list-item" key={banner.id}>
                    <h3>{banner.title}</h3>
                    <p className="muted">
                      {banner.status} - orden {banner.sort_order}
                      {banner.ends_at ? ` - hasta ${toDateInput(banner.ends_at)}` : ""}
                    </p>
                    <div className="admin-actions">
                      <button className="secondary" type="button" onClick={() => setBannerForm(banner)}>
                        Editar
                      </button>
                      <button className="danger" type="button" onClick={() => deleteBanner(banner.id)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>

            <section className="panel">
              <div className="form-head">
                <h2>{categoryForm.id ? "Editar categoria" : "Nueva categoria"}</h2>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setCategoryForm({ id: "", name: "", description: "", sort_order: 0 })}
                >
                  Limpiar
                </button>
              </div>
              <form onSubmit={saveCategory}>
                <label className="field">
                  <span>Nombre</span>
                  <input
                    required
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Descripcion</span>
                  <input
                    value={categoryForm.description}
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, description: event.target.value })
                    }
                  />
                </label>
                <button className="primary" type="submit" disabled={saving}>
                  Guardar categoria
                </button>
              </form>
            </section>

            <aside className="panel">
              <h2>Categorias</h2>
              <div className="list">
                {categories.map((category) => (
                  <article className="list-item" key={category.id}>
                    <h3>{category.name}</h3>
                    <p className="muted">{category.description}</p>
                    <div className="admin-actions">
                      <button className="secondary" type="button" onClick={() => setCategoryForm(category)}>
                        Editar
                      </button>
                      <button className="danger" type="button" onClick={() => deleteCategory(category.id)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function statusLabel(status) {
  if (status === "active") return "Activo";
  if (status === "pending") return "Pendiente";
  if (status === "paused") return "Pausado";
  return status || "Sin estado";
}

function groupAdvertisers(listings) {
  const map = new Map();

  for (const listing of listings) {
    const key = listing.user_id || listing.advertiser_email || listing.advertiser_phone || listing.advertiser_name || listing.id;
    const current = map.get(key) || {
      key,
      name: listing.profile?.full_name || listing.advertiser_name || "",
      email: listing.advertiser_email || "",
      phone: listing.profile?.phone || listing.advertiser_phone || "",
      age: listing.profile?.age || listing.advertiser_age || "",
      status: listing.profile?.status || "active",
      total: 0,
      active: 0,
      pending: 0,
      paused: 0,
      featured: 0
    };

    current.total += 1;
    current.active += listing.status === "active" ? 1 : 0;
    current.pending += listing.status === "pending" ? 1 : 0;
    current.paused += listing.status === "paused" ? 1 : 0;
    current.featured += listing.featured ? 1 : 0;
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

function initials(value) {
  const text = String(value || "PA").trim();
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
