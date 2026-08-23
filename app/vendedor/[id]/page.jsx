"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

export default function SellerPage() {
  const { id } = useParams();
  const [payload, setPayload] = useState({ profile: null, listings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/sellers/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No pudimos cargar este vendedor.");
        setPayload(data);
      })
      .catch((sellerError) => setError(sellerError.message))
      .finally(() => setLoading(false));
  }, [id]);

  const sellerName = payload.profile?.full_name || "Anunciante PanAvisos";

  return (
    <>
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

      <main className="seller-public-page">
        {loading ? <p className="notice">Cargando vendedor...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error ? (
          <>
            <section className="seller-hero">
              <span className="avatar-badge large">{initials(sellerName)}</span>
              <div>
                <span className="eyebrow">Vendedor</span>
                <h1>{sellerName}</h1>
                <p className="muted">{payload.listings.length} anuncios activos en PanAvisos.</p>
              </div>
            </section>

            <section className="seller-more">
              <div className="section-heading">
                <h2>Anuncios activos</h2>
                <Link className="secondary compact-link" href="/">
                  Ver catalogo
                </Link>
              </div>
              <div className="public-card-grid">
                {payload.listings.map((listing) => (
                  <PublicListingCard listing={listing} key={listing.id} />
                ))}
              </div>
              {!payload.listings.length ? <p className="muted">Este vendedor no tiene anuncios activos por ahora.</p> : null}
            </section>
          </>
        ) : null}
      </main>
    </>
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

function initials(value) {
  return String(value || "PA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
