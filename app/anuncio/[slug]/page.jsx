"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { money, whatsappDialNumber } from "@/lib/format";

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
      <PublicHeader title={payload.listing?.title} />
      <main className="public-detail-page">
        {loading ? <p className="notice">Cargando anuncio...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {payload.listing ? (
          <>
            <ListingMiniWeb listing={payload.listing} />
            <SellerMore listing={payload.listing} sellerListings={payload.sellerListings} />
          </>
        ) : null}
      </main>
    </>
  );
}

function PublicHeader({ title }) {
  return (
    <header className="topbar public-listing-topbar">
      <Link className="public-listing-back" href="/" aria-label="Volver al catálogo">
        <span aria-hidden="true" />
      </Link>
      <Link className="brand" href="/">
        <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
      </Link>
      <strong className="public-listing-header-title">{title || "Anuncio"}</strong>
      <nav className="admin-actions">
        <Link className="nav-link" href="/">
          Catálogo
        </Link>
        <Link className="primary small-action" href="/publicar">
          Publicar
        </Link>
      </nav>
    </header>
  );
}

function ListingMiniWeb({ listing }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const images = useMemo(() => [...(listing.images || [])].sort((a, b) => a.position - b.position), [listing.images]);
  const image = images[activeImage]?.url;
  const whatsapp = whatsappDialNumber(listing.whatsapp || listing.advertiser_phone || listing.profile?.phone || "");
  const whatsappMessage = encodeURIComponent(`Hola, vi este anuncio en PanAvisos: ${listing.title}. Sigue disponible?`);
  const sellerName = listing.profile?.full_name || listing.advertiser_name || "Anunciante PanAvisos";
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";
  const closed = closedStatus(listing.status);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text: `Mira este anuncio en PanAvisos: ${listing.title}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch (shareError) {
      if (shareError?.name !== "AbortError") await copyLink();
    }
  }

  function moveImage(direction) {
    if (!images.length) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  return (
    <section className="miniweb-layout">
      <div className="miniweb-gallery">
        <div className="miniweb-stage">
          {image ? <img src={image} alt={listing.title} /> : <span className="empty-image gallery-empty">A</span>}
          {closed ? <div className={`listing-status-ribbon ${listing.status}`}>{closed.ribbon}</div> : null}
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
        {closed ? (
          <div className={`closed-listing-note ${listing.status}`}>
            <strong>{closed.title}</strong>
            <span>{closed.copy}</span>
          </div>
        ) : null}
        <span className="eyebrow">{listing.category?.name || "Anuncio"}</span>
        <h1>{listing.title}</h1>
        <PriceBlock listing={listing} />
        <p className="muted">Publicado en {listing.district}, {listing.province}</p>

        {!closed ? <ListingInquiryForm listing={listing} sellerName={sellerName} /> : null}

        <div className="share-actions">
          {!closed && whatsapp ? (
            <a className="primary" href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`} target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>
          ) : null}
          <button className="secondary" type="button" onClick={copyLink}>
            {copied ? "Link copiado" : "Copiar link"}
          </button>
          <button className="secondary" type="button" onClick={shareLink}>
            {shared ? "Enlace listo" : "Compartir"}
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
              <dt>Recámaras</dt>
              <dd>{listing.bedrooms}</dd>
            </div>
          ) : null}
          {showRealEstateFacts && Number(listing.bathrooms) > 0 ? (
            <div>
              <dt>Baños</dt>
              <dd>{listing.bathrooms}</dd>
            </div>
          ) : null}
          {showRealEstateFacts && Number(listing.area_m2) > 0 ? (
            <div>
              <dt>Área</dt>
              <dd>{listing.area_m2} m2</dd>
            </div>
          ) : null}
        </dl>

        <h2>Descripción</h2>
        <p>{listing.description}</p>

        <h2>Ubicación</h2>
        {listing.lat && listing.lng ? (
          <a
            className="listing-location-card"
            href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="listing-location-pin" aria-hidden="true" />
            <span>
              <strong>Ver ubicación en el mapa</strong>
              <small>{listing.address_reference || `${listing.district}, ${listing.province}`}</small>
            </span>
          </a>
        ) : (
          <p className="muted">{listing.address_reference || `${listing.district}, ${listing.province}`}</p>
        )}

        <div className="seller-panel">
          {listing.profile?.avatar_url ? (
            <img className="profile-photo seller-profile-photo" src={listing.profile.avatar_url} alt="" />
          ) : (
            <span className="avatar-badge">{initials(sellerName)}</span>
          )}
          <div>
            <h2>{sellerName}</h2>
            {listing.profile?.profession ? <p className="profile-profession">{listing.profile.profession}</p> : null}
            <p className="muted">{listing.profile?.phone || listing.advertiser_phone || "Contacto disponible en el anuncio"}</p>
            {listing.profile?.bio ? <p className="seller-panel-bio">{listing.profile.bio}</p> : null}
            {listing.user_id ? (
              <Link className="secondary compact-link" href={`/vendedor/${listing.user_id}`}>
                Ver más anuncios
              </Link>
            ) : null}
          </div>
        </div>

      </aside>
    </section>
  );
}

function ListingInquiryForm({ listing, sellerName }) {
  const sellerDial = whatsappDialNumber(listing.whatsapp || listing.advertiser_phone || listing.profile?.phone || "");
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

    setStatus("Consulta enviada. El anunciante la recibirá en su cuenta de PanAvisos.");
    setForm((current) => ({ ...current, message: defaultMessage }));
  }

  return (
    <section className="seller-contact-card">
      <div>
        <span className="eyebrow">{sellerName}</span>
        <h2>Enviar mensaje</h2>
      </div>
      <form onSubmit={submit}>
        <label className="field contact-identity-field">
          <span>Nombre</span>
          <input required value={form.sender_name} onChange={(event) => setForm({ ...form, sender_name: event.target.value })} placeholder="Tu nombre" />
        </label>
        <label className="field contact-identity-field">
          <span>Correo (opcional si dejas WhatsApp)</span>
          <input
            type="email"
            value={form.sender_email}
            onChange={(event) => setForm({ ...form, sender_email: event.target.value })}
            placeholder="correo@email.com"
          />
        </label>
        <div className="contact-phone-row">
          <span className="country-code">+507</span>
          <label className="field">
            <span>Teléfono</span>
          <input type="tel" inputMode="tel" value={form.sender_phone} onChange={(event) => setForm({ ...form, sender_phone: event.target.value })} placeholder="6000-0000" />
        </label>
      </div>
      <p className="contact-required-note">Deja al menos un medio de contacto para que el anunciante pueda responderte.</p>
        <label className="field">
          <span>Mensaje</span>
          <textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        </label>
        <button className="primary inquiry-submit" type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar mensaje"}
        </button>
        <div className="contact-shortcuts">
          {sellerDial ? <a className="phone-action" href={`tel:+${sellerDial}`}>Llamar</a> : <span className="disabled-contact-action">Llamar</span>}
          {sellerDial ? (
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
        <h2>Más anuncios de este vendedor</h2>
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
  const closed = closedStatus(listing.status);

  return (
    <Link className="public-listing-card" href={`/anuncio/${listing.slug}`}>
      <span className="public-card-media">
        {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">A</span>}
        {closed ? <span className={`small-status-ribbon ${listing.status}`}>{closed.short}</span> : null}
      </span>
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
  return String(value || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function closedStatus(status) {
  if (status === "sold") {
    return {
      title: "Vendido en PanAvisos",
      ribbon: "Vendido",
      short: "Vendido",
      copy: "Este anuncio queda visible como referencia para mostrar actividad real en la página."
    };
  }
  if (status === "rented") {
    return {
      title: "Alquilado en PanAvisos",
      ribbon: "Alquilado",
      short: "Alquilado",
      copy: "Este anuncio queda visible como referencia para mostrar que las oportunidades se concretan."
    };
  }
  return null;
}
