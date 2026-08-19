"use client";

import { useRef, useState } from "react";

const empty = { title: "", slug: "", description: "", operation: "Venta", propertyType: "Apartamento", price: "", currency: "USD", location: "", province: "Panamá", zone: "Ciudad de Panamá", bedrooms: "0", bathrooms: "0", areaLabel: "", featuresText: "", featured: false, status: "published" };

const provinces = ["Panamá", "Panamá Oeste", "Colón", "Coclé", "Chiriquí", "Darién", "Herrera", "Los Santos", "Veraguas", "Bocas del Toro", "Guna Yala", "Emberá-Wounaan", "Ngäbe-Buglé"];

function toForm(property) {
  return { ...empty, ...property, propertyType: property?.type || property?.propertyType || "Apartamento", price: property?.price || "", bedrooms: String(property?.beds ?? property?.bedrooms ?? 0), bathrooms: String(property?.baths ?? property?.bathrooms ?? 0), areaLabel: property?.area || property?.areaLabel || "", featuresText: (property?.amenities || property?.features || []).join(", ") };
}

function initialImages(property) {
  if (!property) return [];
  return [...new Set([...(property.gallery || []), property.image].filter(Boolean))];
}

export function PropertyWizard({ property, isMaster, onClose, onSaved }) {
  const isEditing = Boolean(property?.id);
  const [form, setForm] = useState(() => property ? toForm(property) : empty);
  const [images, setImages] = useState(() => initialImages(property));
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const galleryInput = useRef(null);
  const cameraInput = useRef(null);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setError("");
    setUploading(true);
    try {
      const selected = files.slice(0, Math.max(0, 12 - images.length));
      if (!selected.length) return;
      if (selected.some((file) => file.size > 10 * 1024 * 1024)) throw new Error("Cada foto debe pesar hasta 10 MB.");
      const configurationResponse = await fetch("/api/uploads/property-signature", { method: "POST" });
      const configuration = await configurationResponse.json();
      if (!configurationResponse.ok) throw new Error(configuration.error || "No fue posible preparar la carga de fotos.");
      const results = await Promise.allSettled(selected.map(async (file) => {
        const body = new FormData();
        body.set("file", file);
        body.set("upload_preset", configuration.uploadPreset);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${configuration.cloudName}/image/upload`, { method: "POST", body });
        const payload = await response.json();
        if (!response.ok || !payload.secure_url) throw new Error(payload.error?.message || "Una foto no pudo cargarse.");
        return payload.secure_url;
      }));
      const urls = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
      if (urls.length) setImages((current) => [...current, ...urls].slice(0, 12));
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) throw new Error(failed[0].reason?.message || "No fue posible cargar una de las fotos.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
      if (galleryInput.current) galleryInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  }

  function validateStep() {
    if (step === 1 && !images.length) return "Añade al menos una foto para continuar.";
    if (step === 2 && (!form.title || !form.description || !form.propertyType)) return "Completa el título, la descripción y el tipo de propiedad.";
    if (step === 3 && (!form.price || Number(form.price) <= 0 || !form.province || !form.location || !form.zone)) return "Completa el precio, la provincia, el sector y la ubicación.";
    return "";
  }

  function validateAll() {
    if (!images.length) return "Añade al menos una foto para guardar la propiedad.";
    if (!form.title || !form.description || !form.propertyType) return "Completa el título, la descripción y el tipo de propiedad.";
    if (!form.price || Number(form.price) <= 0 || !form.province || !form.location || !form.zone) return "Completa el precio, la provincia, el sector y la ubicación.";
    return "";
  }

  function next() {
    const message = validateStep();
    if (message) return setError(message);
    setError("");
    setStep((current) => Math.min(3, current + 1));
  }

  async function submit(event) {
    event.preventDefault();
    if (!isEditing && step < 3) return next();
    const message = isEditing ? validateAll() : validateStep();
    if (message) return setError(message);
    setSaving(true);
    setError("");
    const number = Number(form.price);
    const formattedPrice = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(number);
    const payload = {
      ...form,
      price: number,
      priceLabel: `${form.currency} ${formattedPrice}`,
      imageUrl: images[0],
      gallery: images,
      features: form.featuresText.split(",").map((item) => item.trim()).filter(Boolean)
    };
    try {
      const response = await fetch(property?.id ? `/api/admin/properties/${property.id}` : "/api/admin/properties", { method: property?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible guardar la propiedad.");
      onSaved(data.property);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function renderPhotos(compact = false) {
    const previewClass = compact ? "photo-preview-strip" : "photo-preview-grid";
    return <>
      <div className="photo-step-heading"><div><h3>{compact ? "Fotos" : "Fotos de la propiedad"}</h3><p>{compact ? "La primera será la portada. Puedes cambiar o quitar fotos aquí." : "La primera será la portada del anuncio."}</p></div><span>{images.length}/12</span></div>
      <div className={`photo-actions${compact ? " compact" : ""}`}><button className="photo-add-button" type="button" disabled={uploading || images.length >= 12} onClick={() => galleryInput.current?.click()}><b>+</b><span>Elegir fotos</span></button><button className="photo-camera-button" type="button" disabled={uploading || images.length >= 12} onClick={() => cameraInput.current?.click()}>Usar cámara</button></div>
      <input ref={galleryInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => uploadFiles(event.target.files)} />
      <input ref={cameraInput} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => uploadFiles(event.target.files)} />
      {uploading ? <p className="uploading-status">Cargando fotos...</p> : null}
      {images.length ? <div className={previewClass}>{images.map((image, index) => <figure key={image}><img src={image} alt={`Foto ${index + 1} de la propiedad`} />{index === 0 ? <figcaption>Portada</figcaption> : null}<button type="button" aria-label={`Quitar foto ${index + 1}`} onClick={() => setImages((current) => current.filter((item) => item !== image))}>×</button></figure>)}</div> : <div className="photo-empty-state"><strong>Empieza por las fotos</strong><span>Selecciona desde tu celular o computadora.</span></div>}
    </>;
  }

  function renderPropertyFields() {
    return <>
      <div className="form-grid"><label>Título *<input required name="title" value={form.title} onChange={update} placeholder="Ej. Apartamento en Costa del Este" /></label><label>Tipo *<select name="propertyType" value={form.propertyType} onChange={update}><option>Apartamento</option><option>Casa</option><option>Terreno</option><option>Local comercial</option><option>Oficina</option><option>Finca</option><option>Proyecto</option></select></label></div>
      <label>Descripción *<textarea required name="description" rows="6" value={form.description} onChange={update} placeholder="Lo más importante que debe saber quien ve la propiedad." /></label>
      <div className="form-grid"><label>Operación<select name="operation" value={form.operation} onChange={update}><option>Venta</option><option>Alquiler</option></select></label><label>Características<textarea name="featuresText" rows="2" value={form.featuresText} onChange={update} placeholder="Ej. Piscina, seguridad 24/7, estacionamiento" /></label></div>
    </>;
  }

  function renderPriceFields() {
    return <>
      <div className="form-grid price-grid"><label>Precio {form.currency || "USD"} *<input required name="price" min="1" step="1" inputMode="numeric" type="number" value={form.price} onChange={update} placeholder="Ej. 250000" /></label><label>Moneda<select name="currency" value={form.currency} onChange={update}><option value="USD">USD</option><option value="PAB">PAB</option></select></label></div>
      <div className="form-grid"><label>Provincia *<select required name="province" value={form.province} onChange={update}>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label><label>Sector o zona *<input required name="zone" value={form.zone} onChange={update} placeholder="Ej. Costa del Este" /></label></div>
      <label>Ubicación o referencia *<input required name="location" value={form.location} onChange={update} placeholder="Ej. P.H. Ocean Front, Costa del Este" /></label>
      <div className="form-grid thirds"><label>Área<input name="areaLabel" value={form.areaLabel} onChange={update} placeholder="Ej. 125 m²" /></label><label>Recámaras<input name="bedrooms" min="0" type="number" value={form.bedrooms} onChange={update} /></label><label>Baños<input name="bathrooms" min="0" step="0.5" type="number" value={form.bathrooms} onChange={update} /></label></div>
      <div className="publish-choice"><label>Publicación<select name="status" value={form.status} onChange={update}><option value="published">Publicar ahora</option><option value="draft">Guardar como borrador</option><option value="archived">Archivar</option></select><small>Los borradores se guardan solo en el panel hasta que decidas publicarlos.</small></label>{isMaster ? <label className="checkbox-row"><input name="featured" type="checkbox" checked={form.featured} onChange={update} /> Mostrar como destacada</label> : null}</div>
    </>;
  }

  return <section className="admin-panel property-editor-panel property-wizard-panel">
    <div className="panel-title"><div><span className="eyebrow">Inventario</span><h2>{property ? "Editar propiedad" : "Nueva propiedad"}</h2></div><button className="panel-action" onClick={onClose} type="button">Cerrar</button></div>
    {!isEditing ? <><div className="wizard-progress"><span style={{ width: `${step * 33.333}%` }} /></div><ol className="wizard-steps"><li className={step === 1 ? "active" : ""}>1. Fotos</li><li className={step === 2 ? "active" : ""}>2. Propiedad</li><li className={step === 3 ? "active" : ""}>3. Precio y publicar</li></ol></> : <p className="editor-help">Edita cualquier dato sin cambiar de paso. Las fotos se mantienen arriba para ajustarlas cuando lo necesites.</p>}
    <form className="editor-form property-editor" onSubmit={submit}>
      {isEditing ? <><section className="photo-step photo-step-compact">{renderPhotos(true)}</section><section className="form-step">{renderPropertyFields()}</section><section className="form-step">{renderPriceFields()}</section></> : <>{step === 1 ? <section className="photo-step">{renderPhotos()}</section> : null}{step === 2 ? <section className="form-step">{renderPropertyFields()}</section> : null}{step === 3 ? <section className="form-step">{renderPriceFields()}</section> : null}</>}
      {error ? <p className="form-status error" role="alert">{error}</p> : null}
      <div className="admin-form-actions">{isEditing ? <button className="button outline" type="button" onClick={onClose}>Cancelar</button> : step > 1 ? <button className="button outline" type="button" onClick={() => { setError(""); setStep((current) => current - 1); }}>Atrás</button> : <button className="button outline" type="button" onClick={onClose}>Cancelar</button>}<button className="button teal" disabled={uploading || saving} type="submit">{!isEditing && step < 3 ? "Continuar" : saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Publicar propiedad"}</button></div>
    </form>
  </section>;
}
