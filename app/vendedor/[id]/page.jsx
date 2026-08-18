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
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav className="admin-actions">
          <Link className="nav-link" href="/">
            Catálogo
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
              {payload.profile?.avatar_url ? (
                <img className="profile-photo seller-profile-photo" src={payload.profile.avatar_url} alt="" />
              ) : (
                <span className="avatar-badge large">{initials(sellerName)}</span>
              )}
              <div>
                <span className="eyebrow">Vendedor</span>
                <h1>{sellerName}</h1>
                {payload.profile?.profession ? <p className="profile-profession">{payload.profile.profession}</p> : null}
                <p className="muted">{payload.listings.length} anuncios visibles en PanAvisos.</p>
                {payload.profile?.bio ? <p className="profile-bio seller-profile-bio">{payload.profile.bio}</p> : null}
                <div className="seller-profile-links">
                  {payload.profile?.website_url ? (
                    <a className="secondary compact-link" href={payload.profile.website_url} target="_blank" rel="noreferrer">
                      Sitio web
                    </a>
                  ) : null}
                  {payload.profile?.interests ? <span className="fact">{payload.profile.interests}</span> : null}
                </div>
              </div>
            </section>

            <section className="seller-more">
              <div className="section-heading">
                <h2>Anuncios visibles</h2>
                <Link className="secondary compact-link" href="/">
                  Ver catálogo
                </Link>
              </div>
              <div className="public-card-grid">
                {payload.listings.map((listing) => (
                  <PublicListingCard listing={listing} key={listing.id} />
                ))}
              </div>
              {!payload.listings.length ? <p className="muted">Este vendedor no tiene anuncios visibles por ahora.</p> : null}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}

function PublicListingCard({ listing }) {
  const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;
  const closed = closedStatus(listing.status);

  return (
    <Link className="public-listing-card" href={`/anuncio/${listing.slug}`}>
      <span className="public-card-media">
        {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">A</span>}
        {closed ? <span className={`small-status-ribbon ${listing.status}`}>{closed}</span> : null}
      </span>
      <strong>{money(listing.price)}</strong>
      <span>{listing.title}</span>
      <small>{listing.district}, {listing.province}</small>
    </Link>
  );
}

function closedStatus(status) {
  if (status === "sold") return "Vendido";
  if (status === "rented") return "Alquilado";
  return "";
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
