"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/format";

export default function PublicListingPage() {
  const { slug } = useParams();
  const [payload, setPayload] = useState({ listing: null, sellerListings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/listings/${slug}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No pudimos cargar este anuncio.");
        setPayload(data);
      })
      .catch((listingError) => setError(listingError.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <PublicHeader />
      <main className="public-detail-page">
        {loading ? <p className="notice">Cargando anuncio...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {payload.listing ? (
          <>
            <ListingMiniWeb listing={payload.listing} sellerListings={payload.sellerListings} />
            <SellerMore listing={payload.listing} sellerListings={payload.sellerListings} />
          </>
        ) : null}
      </main>
    </>
  );
}

function PublicHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">PA</span>
        <span>
          <strong>PanAvisos</strong>
          <small>Anuncios de Panama</small>
        </span>
      </Link>
      <nav className="admin-actions">
        <Link className="nav-link" href="/">
          Catalogo
        </Link>
        <Link className="primary small-action" href="/publicar">
          Publicar
        </Link>
      </nav>
    </header>
  );
}

function ListingMiniWeb({ listing, sellerListings = [] }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const images = useMemo(() => [...(listing.images || [])].sort((a, b) => a.position - b.position), [listing.images]);
  const image = images[activeImage]?.url;
  const whatsapp = String(listing.whatsapp || listing.advertiser_phone || "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(`Hola, vi este anuncio en PanAvisos: ${listing.title}. Sigue disponible?`);
  const sellerName = listing.profile?.full_name || listing.advertiser_name || "Anunciante PanAvisos";
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";

  async function shareListing() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: listing.title,
          text: `Mira este anuncio en PanAvisos: ${listing.title}`,
          url
        });
        return;
      } catch (shareError) {
        if (shareError?.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function moveImage(direction) {
    if (!images.length) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  return (
    <section className="miniweb-layout">
      <div className="miniweb-gallery">
        <div className="miniweb-stage">
          {image ? <img src={image} alt={listing.title} /> : <span className="empty-image gallery-empty">PA</span>}
          {images.length > 1 ? (
            <>
              <button className="gallery-arrow prev" type="button" onClick={() => moveImage(-1)} aria-label="Imagen anterior">
                {"<"}
              </button>
              <button className="gallery-arrow next" type="button" onClick={() => moveImage(1)} aria-label="Imagen siguiente">
                {">"}
              </button>
            </>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="gallery-thumbs">
            {images.map((item, index) => (
              <button
                className={index === activeImage ? "active" : ""}
                type="button"
                key={item.id || item.url}
                onClick={() => setActiveImage(index)}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <img src={item.url} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="miniweb-info">
        <span className="eyebrow">{listing.category?.name || "Anuncio"}</span>
        <h1>{listing.title}</h1>
        <PriceBlock listing={listing} />
        <p className="muted">Publicado en {listing.district}, {listing.province}</p>

        <div className="share-actions">
          {whatsapp ? (
            <a className="primary" href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`} target="_blank" rel="noreferrer">
              Mensaje por WhatsApp
            </a>
          ) : null}
          <button className="secondary share-trigger" type="button" onClick={shareListing}>
            <span aria-hidden="true">↗</span>
            <span>{copied ? "Link copiado" : "Compartir"}</span>
          </button>
          {listing.website_url ? (
            <a className="secondary" href={listing.website_url} target="_blank" rel="noreferrer">
              Sitio web
            </a>
          ) : null}
          {listing.video_url ? (
            <a className="secondary" href={listing.video_url} target="_blank" rel="noreferrer">
              Video
            </a>
          ) : null}
        </div>

        <h2>Detalles</h2>
        <dl className="detail-list">
          <div>
            <dt>Tipo</dt>
            <dd>{listing.operation}</dd>
          </div>
          {showRealEstateFacts && Number(listing.bedrooms) > 0 ? (
            <div>
              <dt>Recamaras</dt>
              <dd>{listing.bedrooms}</dd>
            </div>
          ) : null}
          {showRealEstateFacts && Number(listing.bathrooms) > 0 ? (
            <div>
              <dt>Banos</dt>
              <dd>{listing.bathrooms}</dd>
            </div>
          ) : null}
          {showRealEstateFacts && Number(listing.area_m2) > 0 ? (
            <div>
              <dt>Area</dt>
              <dd>{listing.area_m2} m2</dd>
            </div>
          ) : null}
        </dl>

        <h2>Descripcion</h2>
        <p>{listing.description}</p>

        <section className="listing-detail-section location-details">
          <h2>Ubicacion</h2>
          <p className="muted">{listing.address_reference || `${listing.district}, ${listing.province}`}</p>
        </section>

        <div className="seller-panel">
          <span className="avatar-badge">{initials(sellerName)}</span>
          <div className="seller-panel-content">
            <span className="eyebrow">Detalles del anunciante</span>
            <h2>{sellerName}</h2>
            {listing.profile?.bio ? <p className="muted seller-bio">{listing.profile.bio}</p> : null}
            <div className={`seller-links ${sellerListings.length ? "" : "single"}`}>
              {listing.user_id && sellerListings.length ? (
                <Link className="secondary compact-link" href={`/vendedor/${listing.user_id}`}>
                  Ver mas anuncios
                </Link>
              ) : null}
              <Link className="secondary compact-link" href="/">
                Ver todos los anuncios
              </Link>
            </div>
          </div>
        </div>

        <ListingInquiryForm listing={listing} sellerName={sellerName} />
      </aside>
    </section>
  );
}

function ListingInquiryForm({ listing, sellerName }) {
  const sellerPhone = String(listing.whatsapp || listing.advertiser_phone || listing.profile?.phone || "").replace(/\D/g, "");
  const sellerDial = sellerPhone ? (sellerPhone.startsWith("507") ? sellerPhone : `507${sellerPhone}`) : "";
  const defaultMessage = `Me interesa el anuncio "${listing.title}" que tienes publicado en PanAvisos.`;
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    sender_phone: "",
    message: defaultMessage
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const whatsappText = encodeURIComponent(form.message || defaultMessage);

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    setSending(true);

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "inquiry",
        subject: `Consulta sobre: ${listing.title}`,
        message: form.message,
        sender_name: form.sender_name,
        sender_email: form.sender_email,
        sender_phone: form.sender_phone,
        listing_id: listing.id,
        listing_title: listing.title
      })
    });

    const payload = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      setError(payload.error || "No pudimos enviar tu consulta.");
      return;
    }

    setStatus("Consulta enviada. Gracias por escribir.");
    setForm((current) => ({ ...current, message: defaultMessage }));
  }

  return (
    <section className="seller-contact-card">
      <div>
        <span className="eyebrow">{sellerName}</span>
        <h2>Dejar mensaje interno</h2>
      </div>
      <form onSubmit={submit}>
        <label className="field">
          <span>Nombre</span>
          <input required value={form.sender_name} onChange={(event) => setForm({ ...form, sender_name: event.target.value })} placeholder="Tu nombre" />
        </label>
        <label className="field">
          <span>Correo</span>
          <input
            required
            type="email"
            value={form.sender_email}
            onChange={(event) => setForm({ ...form, sender_email: event.target.value })}
            placeholder="correo@email.com"
          />
        </label>
        <div className="contact-phone-row">
          <span className="country-code">+507</span>
          <label className="field">
            <span>Telefono</span>
            <input value={form.sender_phone} onChange={(event) => setForm({ ...form, sender_phone: event.target.value })} placeholder="6000-0000" />
          </label>
        </div>
        <label className="field">
          <span>Mensaje</span>
          <textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        </label>
        <button className="primary inquiry-submit" type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar mensaje interno"}
        </button>
        <div className="contact-shortcuts">
          {sellerPhone ? <a className="phone-action" href={`tel:+${sellerDial}`}>Llamar</a> : <span className="disabled-contact-action">Llamar</span>}
          {sellerPhone ? (
            <a className="whatsapp-action" href={`https://wa.me/${sellerDial}?text=${whatsappText}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : (
            <span className="disabled-contact-action">WhatsApp</span>
          )}
        </div>
        {status ? <p className="notice inline-auth-message">{status}</p> : null}
        {error ? <p className="error inline-auth-message">{error}</p> : null}
      </form>
    </section>
  );
}

function SellerMore({ listing, sellerListings }) {
  if (!sellerListings.length) return null;

  return (
    <section className="seller-more">
      <div className="section-heading">
        <h2>Mas anuncios de este vendedor</h2>
        <Link className="secondary compact-link" href={`/vendedor/${listing.user_id}`}>
          Ver todos
        </Link>
      </div>
      <div className="public-card-grid">
        {sellerListings.map((item) => (
          <PublicListingCard listing={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}

function PublicListingCard({ listing }) {
  const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;

  return (
    <Link className="public-listing-card" href={`/anuncio/${listing.slug}`}>
      {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">PA</span>}
      <strong>{money(listing.price)}</strong>
      <span>{listing.title}</span>
      <small>{listing.district}, {listing.province}</small>
    </Link>
  );
}

function PriceBlock({ listing }) {
  return (
    <div className="price-block large">
      <strong>{money(listing.price)}</strong>
    </div>
  );
}

function initials(value) {
  return String(value || "PA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
