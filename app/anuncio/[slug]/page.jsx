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
            <ListingMiniWeb listing={payload.listing} />
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

function ListingMiniWeb({ listing }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const images = useMemo(() => [...(listing.images || [])].sort((a, b) => a.position - b.position), [listing.images]);
  const image = images[activeImage]?.url;
  const whatsapp = String(listing.whatsapp || listing.advertiser_phone || "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(`Hola, vi este anuncio en PanAvisos: ${listing.title}. Sigue disponible?`);
  const sellerName = listing.profile?.full_name || listing.advertiser_name || "Anunciante PanAvisos";
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
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
              Contactar por WhatsApp
            </a>
          ) : null}
          <button className="secondary" type="button" onClick={copyLink}>
            {copied ? "Link copiado" : "Copiar link"}
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

        <div className="seller-panel">
          <span className="avatar-badge">{initials(sellerName)}</span>
          <div>
            <h2>{sellerName}</h2>
            <p className="muted">{listing.profile?.phone || listing.advertiser_phone || "Contacto disponible en el anuncio"}</p>
            {listing.user_id ? (
              <Link className="secondary compact-link" href={`/vendedor/${listing.user_id}`}>
                Ver mas anuncios
              </Link>
            ) : null}
          </div>
        </div>
      </aside>
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
