"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { locationCoordinates, locationSuggestions, nearestKnownLocation } from "@/lib/locations";
import { money, provinces } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { fetchCategoriesWithRetry, readCachedCategories } from "@/lib/categoryCache";
import { findPublishCategoryGroup, getPublishCategoryGroups } from "@/lib/publishCategories";

const DEFAULT_MAX_IMAGES = 5;

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
  lat: "",
  lng: "",
  property_type: "",
  bedrooms: "",
  bathrooms: "",
  area_m2: "",
  land_area_ha: "",
  item_condition: "",
  requested_category: "",
  description: "",
  whatsapp: "",
  email: "",
  website_url: "",
  video_url: "",
  expires_at: defaultExpiresAt(),
  featured: true,
  responsibility_accepted: false,
  images: []
};

export default function PublicarPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [publishType, setPublishType] = useState("");
  const [editingId, setEditingId] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocationKey, setSelectedLocationKey] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(0);
  const [maxImages, setMaxImages] = useState(DEFAULT_MAX_IMAGES);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);

  useEffect(() => {
    let mounted = true;
    const cachedCategories = readCachedCategories();

    function applyCategories(nextCategories) {
      if (!mounted || !Array.isArray(nextCategories)) return;
      setCategories(nextCategories);
      if (nextCategories.length) {
        const query = new URLSearchParams(window.location.search);
        const requestedSlug = query.get("categoria");
        const requestedTitle = String(query.get("titulo") || "").trim();
        const requestedOperation = String(query.get("operacion") || "").trim();
        const requestedCategory = nextCategories.find((category) => category.slug === requestedSlug);
        setCategories(nextCategories);
        setForm((current) => ({
          ...current,
          title: current.title || requestedTitle,
          operation: current.operation === "Venta" && requestedOperation ? requestedOperation : current.operation,
          category_id: current.category_id || requestedCategory?.id || ""
        }));
      }
    }

    if (cachedCategories.length) applyCategories(cachedCategories);

    setCategoriesLoading(true);
    setCategoriesError("");
    fetchCategoriesWithRetry()
      .then((nextCategories) => {
        applyCategories(nextCategories);
        setCategoriesError(nextCategories.length ? "" : "Aún no hay categorías disponibles.");
      })
      .catch(() => {
        if (!cachedCategories.length) {
          setCategoriesError("No pudimos cargar las categorías. Reintenta sin perder lo que ya escribiste.");
        }
      })
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [categoriesReloadKey]);

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((payload) => {
        const configuredMax = Number(payload.maxListingImages);
        if (Number.isFinite(configuredMax) && configuredMax > 0) {
          setMaxImages(Math.min(10, Math.max(1, configuredMax)));
        }
      })
      .catch(() => setMaxImages(DEFAULT_MAX_IMAGES));
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await hydrateProfile(data.session);
      await loadEditableListing(data.session);
      setAuthReady(true);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      hydrateProfile(nextSession);
      setAuthReady(true);
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadEditableListing(nextSession) {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;

    setEditingId(editId);
    if (!nextSession?.access_token) {
      setError("Inicia sesión para editar este anuncio.");
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
  const publishCategoryGroups = useMemo(() => getPublishCategoryGroups(categories), [categories]);
  const selectedPublishGroup = findPublishCategoryGroup(publishCategoryGroups, form.category_id);
  const activePublishGroup =
    publishCategoryGroups.find((group) => group.key === publishType) ||
    selectedPublishGroup ||
    null;
  const isRealEstate = selectedCategory?.slug === "bienes-raices";
  const categorySlug = selectedCategory?.slug || "";
  const isOtherCategory = categorySlug === "otros";
  const isServiceCategory = /servicio|empleo|ninera|limpieza|asesoria|hospedaje|restaurante|belleza|secretaria|salonera|mesero|azafata|evento|masaje|cuidado/.test(categorySlug);
  const isLandOrCommercial = /terreno|lote|finca|local|oficina|bodega/i.test(form.property_type);

  const locationMatches = useMemo(() => {
    const query = normalize(form.district);
    if (!query || query.length < 2) return [];
    if (selectedLocationKey === query) return [];
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
  }, [form.district, selectedLocationKey]);

  const currentStep = Math.min(step, 3);
  const missingStepOneFields = getMissingPublishFields(form);
  const visibleError = showRequiredErrors && currentStep === 1
    ? (missingStepOneFields.length ? formatMissingPublishFields(missingStepOneFields) : "")
    : error;

  function setCategory(categoryId) {
    const nextCategory = categories.find((category) => category.id === categoryId);
    const nextSlug = nextCategory?.slug || "";
    const nextGroup = findPublishCategoryGroup(publishCategoryGroups, categoryId);
    const nextIsService = /servicio|empleo|ninera|limpieza|asesoria|hospedaje|restaurante|belleza|secretaria|salonera|mesero|azafata|evento|masaje|cuidado/.test(nextSlug);
    if (nextGroup) setPublishType(nextGroup.key);
    setForm({
      ...form,
      category_id: categoryId,
      operation: nextGroup?.operation || form.operation,
      property_type: nextCategory?.slug === "bienes-raices" ? form.property_type : "",
      bedrooms: nextCategory?.slug === "bienes-raices" ? form.bedrooms : "",
      bathrooms: nextCategory?.slug === "bienes-raices" ? form.bathrooms : "",
      area_m2: nextCategory?.slug === "bienes-raices" ? form.area_m2 : "",
      land_area_ha: nextCategory?.slug === "bienes-raices" ? form.land_area_ha : "",
      item_condition: nextCategory?.slug === "bienes-raices" || nextIsService ? "" : form.item_condition,
      requested_category: nextCategory?.slug === "otros" ? form.requested_category : ""
    });
  }

  function choosePublishType(group) {
    setPublishType(group.key);
    setForm((current) => ({
      ...current,
      operation: group.operation || current.operation,
      category_id: selectedPublishGroup?.key === group.key ? current.category_id : "",
      item_condition: group.key === "article" || group.key === "vehicle" ? current.item_condition : ""
    }));
  }

  function chooseLocation(location) {
    const coordinates = locationCoordinates(location);
    setForm({
      ...form,
      province: location.province,
      district: location.district,
      address_reference: location.label,
      lat: coordinates.lat ?? "",
      lng: coordinates.lng ?? ""
    });
    setSelectedLocationKey(normalize(location.district));
    setLocationStatus("Zona seleccionada. Puedes cambiarla antes de publicar.");
    setLocationOpen(false);
  }

  function detectListingLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Tu navegador no permite detectar la ubicación. Escríbela manualmente.");
      return;
    }

    setLocating(true);
    setLocationStatus("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = nearestKnownLocation(coords.latitude, coords.longitude);
        setForm((current) => ({
          ...current,
          province: nearest?.province || current.province,
          district: nearest?.district || current.district || "Ubicación actual",
          address_reference: nearest?.label || current.address_reference || "Ubicación aproximada",
          lat: Number(coords.latitude.toFixed(3)),
          lng: Number(coords.longitude.toFixed(3))
        }));
        if (nearest?.district) setSelectedLocationKey(normalize(nearest.district));
        setLocationStatus("Ubicación aproximada detectada. Edítala si el anuncio está en otro lugar.");
        setLocating(false);
      },
      () => {
        setLocationStatus("No pudimos detectar tu ubicación. Puedes escribirla manualmente.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
    );
  }

  function goNext() {
    setError("");
    if (currentStep === 1) {
      const missingFields = getMissingPublishFields(form);
      if (missingFields.length) {
        setShowRequiredErrors(true);
        setError(formatMissingPublishFields(missingFields));
        focusPublishField(missingFields[0].key);
        return;
      }
      setShowRequiredErrors(false);
    }

    if (currentStep === 1 && form.operation === "Oferta" && !form.expires_at) {
      setError("Las ofertas deben tener fecha de vigencia.");
      return;
    }

    if (currentStep === 1 && isOtherCategory && !form.requested_category.trim()) {
      setError("Escribe qué categoría necesitas para revisarla y crearla después.");
      return;
    }

    if (currentStep === 2 && !form.district) {
      setError("Completa la ubicación para continuar.");
      return;
    }

    if (currentStep === 2 && !session?.access_token) {
      setError("Inicia sesión con Google o correo para publicar.");
      return;
    }

    if (currentStep === 1 && !form.district) detectListingLocation();
    setStep((value) => Math.min(3, value + 1));
  }

  async function uploadImages(files) {
    setError("");
    if (!session?.access_token) {
      setError("Inicia sesión antes de subir fotos.");
      return;
    }

    const selectedFiles = Array.from(files || []);
    const availableSlots = maxImages - form.images.length - uploadingPhotos;
    if (!selectedFiles.length) return;

    if (availableSlots <= 0) {
      setError(`Puedes subir hasta ${maxImages} fotos por anuncio.`);
      return;
    }

    const filesToUpload = selectedFiles.slice(0, availableSlots);
    if (selectedFiles.length > availableSlots) {
      setError(`Solo se agregaron ${availableSlots} foto(s). El límite actual es ${maxImages}.`);
    }

    setSaving(true);
    setUploadingPhotos((count) => count + filesToUpload.length);
    try {
      const nextImages = [];
      for (const file of filesToUpload) {
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
        setUploadingPhotos((count) => Math.max(0, count - 1));
      }

      setForm((current) => ({ ...current, images: [...current.images, ...nextImages] }));
    } catch (uploadError) {
      setError(uploadError.message || "No se pudieron subir las imágenes.");
    } finally {
      setUploadingPhotos(0);
      setSaving(false);
    }
  }

  function removeImage(index) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function submitListing(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!session?.access_token) {
      setSaving(false);
      setError("Inicia sesión para publicar.");
      return;
    }

    if (!form.responsibility_accepted) {
      setSaving(false);
      setError("Acepta la responsabilidad del anuncio antes de publicar.");
      return;
    }

    const payload = {
      ...form,
      bedrooms: isRealEstate && !isLandOrCommercial ? form.bedrooms : "",
      bathrooms: isRealEstate && !isLandOrCommercial ? form.bathrooms : "",
      area_m2: isRealEstate ? form.area_m2 : "",
      land_area_ha: isRealEstate ? form.land_area_ha : "",
      item_condition: !isRealEstate && !isServiceCategory ? form.item_condition : "",
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
      setError(result.error || "No se pudo enviar la publicación.");
      return;
    }

    router.push(editingId ? "/cuenta?updated=1" : "/cuenta?published=1");
  }

  return (
    <>
      <header className="topbar marketplace-topbar publish-topbar">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav className="top-actions">
          <Link href="/">Catálogo</Link>
          <Link href="/cuenta">Cuenta</Link>
        </nav>
      </header>

      <main className="publish-workspace">
        {!authReady ? (
          <section className="publish-gate">
            <div className="publish-gate-card">
              <span className="eyebrow dark-eyebrow">Publicar anuncio</span>
              <h1>Preparando tu cuenta...</h1>
              <p className="muted">Estamos revisando tu sesión antes de abrir el formulario.</p>
            </div>
          </section>
        ) : !session?.access_token ? (
          <section className="publish-gate">
            <div className="publish-gate-card">
              <span className="eyebrow dark-eyebrow">Publicar anuncio</span>
              <h1>Primero entra o crea tu cuenta</h1>
              <p className="muted">
                Para que no llenes fotos y datos por gusto, PanAvisos te pide identificarte antes de crear o editar un anuncio.
              </p>
              <div className="publish-gate-actions">
                <Link className="primary" href="/cuenta?next=/publicar">
                  Iniciar sesión
                </Link>
                <Link className="secondary" href="/cuenta?next=/publicar&mode=register">
                  Crear cuenta
                </Link>
              </div>
              <ul className="publish-gate-list">
                <li>Tus fotos quedan asociadas a tu usuario.</li>
                <li>Luego puedes editar, pausar o renovar tus anuncios.</li>
                <li>Los interesados saben que hay una cuenta real detrás.</li>
              </ul>
            </div>
          </section>
        ) : (
        <form className="publish-form" onSubmit={submitListing}>
          <div className="publish-head">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h1>Crear anuncio</h1>
              {editingId ? <p className="muted">Editando publicación existente</p> : null}
            </div>
          </div>

          <div className="step-meter" aria-label="Progreso">
            <span className={currentStep >= 1 ? "active" : ""} />
            <span className={currentStep >= 2 ? "active" : ""} />
            <span className={currentStep >= 3 ? "active" : ""} />
          </div>

          <p className="muted step-copy">
            {currentStep === 1 ? "Fotos y contenido del anuncio." : null}
            {currentStep === 2 ? "Ubicación del anuncio." : null}
            {currentStep === 3 ? "Revisa la vista previa y publica." : null}
          </p>

          {message ? <p className="notice">{message}</p> : null}
          {visibleError ? <p className="error">{visibleError}</p> : null}

          {currentStep === 1 ? (
            <div className="step-pane">
              <PhotoUploader
                images={form.images}
                maxImages={maxImages}
                uploadingPhotos={uploadingPhotos}
                onUpload={uploadImages}
                onRemove={removeImage}
              />

              <label className="field">
                <span>Título</span>
                <input
                  id="publish-title"
                  required
                  aria-invalid={showRequiredErrors && !form.title.trim()}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
                {showRequiredErrors && !form.title.trim() ? <small className="field-error">Escribe un título.</small> : null}
              </label>

              <label className="field">
                <span>Precio USD</span>
                <input
                  id="publish-price"
                  required
                  type="number"
                  aria-invalid={showRequiredErrors && String(form.price).trim() === ""}
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                />
                {showRequiredErrors && String(form.price).trim() === "" ? <small className="field-error">Indica el precio.</small> : null}
              </label>

              <PublishCategoryChooser
                groups={publishCategoryGroups}
                activeGroup={activePublishGroup}
                selectedCategoryId={form.category_id}
                suggestedQuery={form.title}
                invalid={showRequiredErrors && !form.category_id}
                loading={categoriesLoading && !categories.length}
                error={categoriesError}
                onRetry={() => setCategoriesReloadKey((current) => current + 1)}
                onChooseType={choosePublishType}
                onChooseCategory={setCategory}
              />

              <label className="field">
                <span>Tipo</span>
                <select value={form.operation} onChange={(event) => setForm({ ...form, operation: event.target.value })}>
                  <option>Venta</option>
                  <option>Alquiler</option>
                  <option>Servicio</option>
                  <option>Oferta</option>
                </select>
              </label>

              {isOtherCategory ? (
                <label className="field">
                  <span>Categoría que necesitas</span>
                  <input
                    required
                    value={form.requested_category}
                    onChange={(event) => setForm({ ...form, requested_category: event.target.value })}
                    placeholder="Ej. mascotas, maquinaria, clases, eventos..."
                  />
                  <small>La guardaré como sugerencia para crear nuevas categorías según lo que pidan los usuarios.</small>
                </label>
              ) : null}

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
                <>
                  <label className="field">
                    <span>Tipo de propiedad</span>
                    <select value={form.property_type} onChange={(event) => setForm({ ...form, property_type: event.target.value })}>
                      <option value="">Selecciona una opción</option>
                      <option>Casa</option>
                      <option>Apartamento</option>
                      <option>Local comercial</option>
                      <option>Oficina</option>
                      <option>Bodega</option>
                      <option>Terreno o lote</option>
                      <option>Finca</option>
                      <option>Otro</option>
                    </select>
                  </label>
                  <div className="field-row">
                    {!isLandOrCommercial ? (
                      <>
                        <label className="field">
                          <span>Recámaras</span>
                          <input type="number" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} />
                        </label>
                        <label className="field">
                          <span>Baños</span>
                          <input type="number" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} />
                        </label>
                      </>
                    ) : null}
                    <label className="field">
                      <span>Área m2</span>
                      <input type="number" value={form.area_m2} onChange={(event) => setForm({ ...form, area_m2: event.target.value })} />
                    </label>
                    {isLandOrCommercial ? (
                      <label className="field">
                        <span>Hectáreas</span>
                        <input type="number" step="0.0001" value={form.land_area_ha} onChange={(event) => setForm({ ...form, land_area_ha: event.target.value })} />
                      </label>
                    ) : null}
                  </div>
                </>
              ) : null}

              {selectedCategory && !isRealEstate && !isServiceCategory ? (
                <label className="field">
                  <span>Estado</span>
                  <select value={form.item_condition} onChange={(event) => setForm({ ...form, item_condition: event.target.value })}>
                    <option value="">Selecciona una opción</option>
                    <option>Nuevo</option>
                    <option>Usado - Como nuevo</option>
                    <option>Usado - Buen estado</option>
                    <option>Usado - Aceptable</option>
                  </select>
                </label>
              ) : null}

              <label className="field">
                <span>Descripción</span>
                <textarea
                  id="publish-description"
                  required
                  rows={5}
                  aria-invalid={showRequiredErrors && !form.description.trim()}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
                {showRequiredErrors && !form.description.trim() ? <small className="field-error">Añade una descripción.</small> : null}
              </label>

              <label className="field">
                <span>Sitio web</span>
                <input type="url" value={form.website_url} onChange={(event) => setForm({ ...form, website_url: event.target.value })} placeholder="https://cliente.com" />
              </label>

              <label className="field">
                <span>WhatsApp opcional</span>
                <input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="Ej: 6000-0000" />
              </label>

              <label className="field">
                <span>Link de video opcional</span>
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(event) => setForm({ ...form, video_url: event.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="step-pane">
              <div className="publish-location-assist">
                <div>
                  <strong>¿El anuncio está cerca de ti?</strong>
                  <small>Podemos sugerir la zona y luego tú decides si conservarla o cambiarla.</small>
                </div>
                <button className="secondary" type="button" onClick={detectListingLocation} disabled={locating}>
                  {locating ? "Detectando..." : "Usar mi ubicación"}
                </button>
              </div>
              {locationStatus ? <p className="location-status" role="status">{locationStatus}</p> : null}
              <label className="field location-field">
                <span>Ubicación</span>
                <input
                  required
                  value={form.district}
                  onChange={(event) => {
                    setForm({ ...form, district: event.target.value, lat: "", lng: "" });
                    setSelectedLocationKey("");
                    setLocationStatus("");
                    setLocationOpen(true);
                  }}
                  onFocus={() => {
                    if (selectedLocationKey !== normalize(form.district)) setLocationOpen(true);
                  }}
                  onBlur={() => window.setTimeout(() => setLocationOpen(false), 120)}
                  autoComplete="off"
                  aria-expanded={locationOpen && locationMatches.length > 0}
                  placeholder="Ej: Parque Lefevre, Coronado..."
                />
                {locationOpen && locationMatches.length ? (
                  <div className="suggestion-list">
                    {locationMatches.map((location) => (
                      <button
                        type="button"
                        key={location.label}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          chooseLocation(location);
                        }}
                        onClick={() => chooseLocation(location)}
                      >
                        {location.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>

              <label className="field">
                <span>Provincia</span>
                <select
                  value={form.province}
                  onChange={(event) => {
                    setForm({ ...form, province: event.target.value, lat: "", lng: "" });
                    setLocationStatus("");
                  }}
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="step-pane">
              <div className="review-card">
              <h2>{editingId ? "Enviar cambios" : "Publicar en PanAvisos"}</h2>
              <p className="muted">Tu anuncio se publicará de inmediato. No se borra lo que llenaste si vuelves atrás.</p>
                {!editingId ? (
                  <label className="founder-feature-check">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                    />
                    <span>
                      <strong>Destacado fundador gratis</strong>
                      <small>
                        Solicita resaltado de cortesía para esta fase inicial. Aplica para las primeras 100 cuentas y puede ajustarse si el equipo detecta abuso o contenido duplicado.
                      </small>
                    </span>
                  </label>
                ) : null}
                <label className="responsibility-check">
                  <input
                    type="checkbox"
                    checked={form.responsibility_accepted}
                    onChange={(event) => setForm({ ...form, responsibility_accepted: event.target.checked })}
                  />
                  <span>
                    Confirmo que soy responsable por la información, fotos, precio y condiciones de este anuncio. Entiendo que PanAvisos solo facilita la publicación y el contacto.
                  </span>
                </label>
                <div className="review-row">
                  <span>Título</span>
                  <strong>{form.title || "Sin título"}</strong>
                </div>
                <div className="review-row">
                  <span>Precio</span>
                  <strong>{money(form.price)}</strong>
                </div>
                <div className="review-row">
                  <span>Ubicación</span>
                  <strong>{form.district || "Sin ubicación"}</strong>
                </div>
                <div className="review-row">
                  <span>Anunciante</span>
                  <strong>{profile?.name || session?.user?.email || "Tu cuenta"}</strong>
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
            {visibleError ? <p className="publish-bottom-error" role="alert">{visibleError}</p> : null}
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
        )}

        {authReady && session?.access_token ? (
        <section className="publish-preview">
          <h2>Vista previa</h2>
          <div className="preview-shell">
            <div className="preview-media">
              {form.images[0]?.url ? <img src={form.images[0].url} alt="" /> : <span>Vista previa de la publicación</span>}
            </div>
            <aside className="preview-info">
              <h3>{form.title || "Título"}</h3>
              <PriceBlock listing={form} />
              <p className="muted">Publicado hace unos segundos en {form.district || "Ciudad de Panamá"}</p>
              <h4>Detalles</h4>
              <p>{form.description || "La descripción aparecerá aquí."}</p>
              {form.video_url ? (
                <a className="secondary preview-link" href={form.video_url} target="_blank" rel="noreferrer">
                  Ver video
                </a>
              ) : null}
              <h4>Información del vendedor</h4>
              <p>{profile?.name || "Tu cuenta"}</p>
              <button className="primary" type="button" disabled>
                Enviar mensaje
              </button>
            </aside>
          </div>
        </section>
        ) : null}
      </main>
    </>
  );
}

function PublishCategoryChooser({
  groups,
  activeGroup,
  selectedCategoryId,
  suggestedQuery,
  invalid,
  loading,
  error,
  onRetry,
  onChooseType,
  onChooseCategory
}) {
  const [query, setQuery] = useState("");
  const [queryTouched, setQueryTouched] = useState(false);
  const categoryCount = activeGroup?.sections.reduce((total, section) => total + section.categories.length, 0) || 0;
  const categories = useMemo(
    () => groups.flatMap((group) => group.sections.flatMap((section) => section.categories.map((category) => ({ category, group })))),
    [groups]
  );
  const selectedCategory = categories.find((item) => item.category.id === selectedCategoryId);
  const searchResults = useMemo(() => searchPublishCategories(categories, query), [categories, query]);

  useEffect(() => {
    const titleQuery = String(suggestedQuery || "").trim();
    if (!queryTouched && !selectedCategoryId && titleQuery.length >= 3) setQuery(titleQuery);
  }, [queryTouched, selectedCategoryId, suggestedQuery]);

  function chooseSearchResult(item) {
    onChooseCategory(item.category.id);
    setQuery(item.category.name);
    setQueryTouched(true);
  }

  function clearSelection() {
    onChooseCategory("");
    setQuery("");
    setQueryTouched(false);
  }

  return (
    <section className="publish-category-chooser" aria-labelledby="publish-category-title">
      <div className="publish-category-heading">
        <div>
          <span className="field-label">Tipo de publicación</span>
          <h2 id="publish-category-title">Elige qué vas a publicar</h2>
        </div>
        {selectedCategoryId ? <small>Categoría seleccionada</small> : null}
      </div>

      <label className="publish-category-direct" htmlFor="publish-category-select">
        <span>Categoría</span>
        <select
          id="publish-category-select"
          value={selectedCategoryId}
          aria-invalid={invalid}
          onChange={(event) => {
            const categoryId = event.target.value;
            if (!categoryId) {
              clearSelection();
              return;
            }
            const item = categories.find((entry) => entry.category.id === categoryId);
            onChooseCategory(categoryId);
            setQuery(item?.category.name || "");
            setQueryTouched(true);
          }}
        >
          <option value="">Selecciona una categoría</option>
          {[...groups]
            .sort((a, b) => desktopCategoryOrder[a.key] - desktopCategoryOrder[b.key])
            .flatMap((group) => group.sections.map((section) => (
            <optgroup key={`${group.key}-${section.label}`} label={`${group.label}: ${section.label}`}>
              {section.categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </optgroup>
          )))}
        </select>
        <small>También puedes usar el buscador para encontrarla más rápido.</small>
      </label>

      <div className="publish-category-search">
        <label htmlFor="publish-category-search">Busca el producto o servicio</label>
        <input
          id="publish-category-search"
          type="search"
          value={query}
          aria-invalid={invalid}
          onChange={(event) => {
            setQuery(event.target.value);
            setQueryTouched(true);
          }}
          placeholder="Ej.: teclado, celular, masaje o apartamento"
          autoComplete="off"
        />
        {query.trim().length >= 2 && !selectedCategory ? (
          <div className="publish-category-results" role="listbox" aria-label="Categorías sugeridas">
            {searchResults.length ? searchResults.map((item) => (
              <button
                type="button"
                role="option"
                key={item.category.id}
                onClick={() => chooseSearchResult(item)}
              >
                <span>
                  <strong>{item.category.name}</strong>
                  <small>{item.category.description || item.group.label}</small>
                </span>
                <em>{item.group.label}</em>
              </button>
            )) : <p>No encontramos esa categoría. Puedes elegir un tipo abajo.</p>}
          </div>
        ) : null}
      </div>

      {selectedCategory ? (
        <div className="publish-category-selected" role="status">
          <span>
            <small>Categoría</small>
            <strong>{selectedCategory.category.name}</strong>
          </span>
          <button type="button" onClick={clearSelection}>Cambiar</button>
        </div>
      ) : null}

      {loading ? <p className="muted">Cargando categorías...</p> : null}
      {error ? (
        <span className="category-load-error" role="status">
          {error}
          <button type="button" onClick={onRetry}>Reintentar</button>
        </span>
      ) : null}

      <div className="publish-category-browse">
        <span className="publish-category-or">O explora por tipo</span>

        <div className="publish-type-grid">
          {groups.map((group) => (
            <button
              className={`publish-type-card ${activeGroup?.key === group.key ? "active" : ""}`}
              type="button"
              key={group.key}
              onClick={() => {
                onChooseType(group);
                setQuery("");
                setQueryTouched(true);
              }}
            >
              <strong>{group.label}</strong>
              <span>{group.description}</span>
            </button>
          ))}
        </div>

        {activeGroup && categoryCount && !selectedCategory ? (
          <div className="publish-subcategory-panel">
            <span className="field-label">Categoría</span>
            {activeGroup.sections.map((section) => (
              <div className="publish-subcategory-section" key={section.label}>
                <strong>{section.label}</strong>
                <div className="publish-subcategory-list">
                  {section.categories.map((category) => (
                    <button
                      className={selectedCategoryId === category.id ? "active" : ""}
                      type="button"
                      key={category.id}
                      onClick={() => onChooseCategory(category.id)}
                    >
                      <span>{category.name}</span>
                      {category.description ? <small>{category.description}</small> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {invalid ? <small className="field-error">Selecciona una categoría.</small> : null}
    </section>
  );
}

function getMissingPublishFields(form) {
  return [
    { key: "title", label: "título", missing: !form.title.trim() },
    { key: "price", label: "precio", missing: String(form.price).trim() === "" },
    { key: "category", label: "categoría", missing: !form.category_id },
    { key: "description", label: "descripción", missing: !form.description.trim() }
  ].filter((field) => field.missing);
}

const desktopCategoryOrder = {
  property: 0,
  work: 1,
  services: 2,
  article: 3,
  vehicle: 4
};

function formatMissingPublishFields(fields) {
  if (fields.length === 1) {
    const messages = {
      title: "Escribe un título para continuar.",
      price: "Indica el precio para continuar.",
      category: "Selecciona una categoría para continuar.",
      description: "Añade una descripción para continuar."
    };
    return messages[fields[0].key];
  }

  const labels = fields.map((field) => field.label);
  const last = labels.pop();
  return `Falta completar: ${labels.join(", ")} y ${last}.`;
}

function focusPublishField(key) {
  const desktopCategory = window.matchMedia("(min-width: 761px)").matches;
  const ids = {
    title: "publish-title",
    price: "publish-price",
    category: desktopCategory ? "publish-category-select" : "publish-category-search",
    description: "publish-description"
  };
  window.setTimeout(() => {
    const target = document.getElementById(ids[key]);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  }, 0);
}

const categorySearchAliases = {
  "computadoras-y-tablets": "teclado teclados mouse monitor laptop computadora pc impresora",
  "electronica-y-audio": "audifono audifonos bocina bocinas parlante radio television tv camara",
  "celulares-y-accesorios": "telefono telefonos celular celulares smartphone cargador",
  "hogar-y-muebles": "silla sillas mesa cama sofa mueble muebles",
  "herramientas-y-construccion": "taladro martillo herramienta herramientas materiales",
  autos: "auto carro carros vehiculo sedan camioneta",
  "bienes-raices": "apartamento casa vivienda propiedad alquiler venta",
  "locales-comerciales": "local oficina consultorio bodega",
  empleos: "trabajo vacante buscar empleo contratar",
  servicios: "servicio profesional tecnico reparacion",
  masajes: "masaje masajista relajante terapeutico"
};

function normalizeCategorySearch(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function searchPublishCategories(items, value) {
  const query = normalizeCategorySearch(value);
  if (query.length < 2) return [];

  return items
    .map((item) => {
      const name = normalizeCategorySearch(item.category.name);
      const slug = normalizeCategorySearch(item.category.slug);
      const aliases = normalizeCategorySearch(categorySearchAliases[item.category.slug] || "");
      const description = normalizeCategorySearch(item.category.description);
      const group = normalizeCategorySearch(`${item.group.label} ${item.group.description}`);
      let rank = 10;
      if (name === query) rank = 0;
      else if (name.startsWith(query)) rank = 1;
      else if (name.includes(query) || slug.includes(query)) rank = 2;
      else if (aliases.includes(query)) rank = 3;
      else if (description.includes(query) || group.includes(query)) rank = 4;
      return { ...item, rank };
    })
    .filter((item) => item.rank < 10)
    .sort((a, b) => a.rank - b.rank || a.category.name.localeCompare(b.category.name))
    .slice(0, 6);
}

function PhotoUploader({ images, maxImages, uploadingPhotos, onUpload, onRemove }) {
  const placeholders = Array.from({ length: uploadingPhotos });
  const canAdd = images.length + uploadingPhotos < maxImages;

  return (
    <div className="photo-uploader">
      <div className="photo-count">
        <strong>Fotos</strong>
        <span>
          {images.length}/{maxImages}
        </span>
      </div>
      <div className="photo-grid">
        {images.map((image, index) => (
          <div className="photo-tile filled" key={`${image.url}-${index}`}>
            <img src={image.url} alt={`Foto ${index + 1}`} />
            <button type="button" className="photo-remove" onClick={() => onRemove(index)} aria-label={`Quitar foto ${index + 1}`}>
              x
            </button>
          </div>
        ))}
        {placeholders.map((_, index) => (
          <div className="photo-tile loading" key={`loading-${index}`}>
            <span />
            <small>Subiendo</small>
          </div>
        ))}
        {canAdd ? (
          <label className="photo-tile add-photo">
            <input type="file" accept="image/*" multiple onChange={(event) => onUpload(event.target.files)} />
            <strong>+</strong>
            <span>Añadir foto</span>
          </label>
        ) : null}
      </div>
      <p className="muted photo-help">Puedes subir hasta {maxImages} fotos. La primera será la imagen principal.</p>
    </div>
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
    lat: listing.lat ?? "",
    lng: listing.lng ?? "",
    property_type: listing.property_type || "",
    bedrooms: listing.bedrooms || "",
    bathrooms: listing.bathrooms || "",
    area_m2: listing.area_m2 || "",
    land_area_ha: listing.land_area_ha || "",
    item_condition: listing.item_condition || "",
    requested_category: listing.requested_category || "",
    description: listing.description || "",
    whatsapp: listing.whatsapp || "",
    email: listing.email || "",
    website_url: listing.website_url || "",
    video_url: listing.video_url || "",
    expires_at: listing.expires_at ? String(listing.expires_at).slice(0, 10) : defaultExpiresAt(),
    featured: Boolean(listing.featured),
    responsibility_accepted: listing.responsibility_accepted ?? true,
    images
  };
}
