"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { money, provinces } from "@/lib/format";

export default function HomePage() {
  const [data, setData] = useState({ categories: [], listings: [] });
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    province: "",
    min: "",
    max: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog")
      .then((response) => response.json())
      .then((payload) => setData(payload))
      .finally(() => setLoading(false));
  }, []);

  const listings = useMemo(() => {
    const q = normalize(filters.q);
    const min = Number(filters.min || 0);
    const max = Number(filters.max || Number.MAX_SAFE_INTEGER);

    return (data.listings || []).filter((listing) => {
      const searchText = normalize(
        `${listing.title} ${listing.description} ${listing.province} ${listing.district} ${listing.category?.name || ""}`
      );

      return (
        (!q || searchText.includes(q)) &&
        (!filters.category || listing.category_id === filters.category) &&
        (!filters.province || listing.province === filters.province) &&
        Number(listing.price) >= min &&
        Number(listing.price) <= max
      );
    });
  }, [data, filters]);

  return (
    <>
      <Topbar />
      <main className="shell">
        <aside className="filters">
          <h1>Anuncios en Panama</h1>
          <p>Marketplace inicial para propiedades, autos y servicios.</p>

          <label className="field">
            <span>Buscar</span>
            <input
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              placeholder="Apartamento, lote, servicio..."
            />
          </label>

          <label className="field">
            <span>Categoria</span>
            <select
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">Todas</option>
              {data.categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Provincia</span>
            <select
              value={filters.province}
              onChange={(event) => setFilters({ ...filters, province: event.target.value })}
            >
              <option value="">Todas</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row">
            <label className="field">
              <span>Minimo</span>
              <input
                type="number"
                value={filters.min}
                onChange={(event) => setFilters({ ...filters, min: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Maximo</span>
              <input
                type="number"
                value={filters.max}
                onChange={(event) => setFilters({ ...filters, max: event.target.value })}
              />
            </label>
          </div>
        </aside>

        <section className="results">
          <div className="toolbar">
            <div>
              <strong>{loading ? "Cargando..." : `${listings.length} anuncios`}</strong>
              <span className="muted"> disponibles</span>
            </div>
            <Link className="nav-link" href="/admin">
              Admin
            </Link>
          </div>

          {!loading && listings.length === 0 ? (
            <div className="notice">Todavia no hay anuncios con esos filtros.</div>
          ) : (
            <div className="grid">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onSelect={setSelected} />
              ))}
            </div>
          )}
        </section>
      </main>

      {selected ? <ListingDetail listing={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">PA</span>
        <span>
          <strong>PanAvisos</strong>
          <small>Marketplace de Panama</small>
        </span>
      </Link>
      <Link className="nav-link" href="/admin">
        Panel admin
      </Link>
    </header>
  );
}

function ListingCard({ listing, onSelect }) {
  const image = listing.images?.sort((a, b) => a.position - b.position)?.[0]?.url;

  return (
    <article className="card">
      {image ? <img className="card-image" src={image} alt={listing.title} /> : <div className="card-image" />}
      <div className="card-body">
        <div className="facts">
          <span className="pill">{listing.category?.name || "Sin categoria"}</span>
          {listing.featured ? <span className="pill featured">Destacado</span> : null}
          <span className="pill">{listing.operation}</span>
        </div>
        <h2>{listing.title}</h2>
        <p>{listing.description}</p>
        <div className="facts">
          {Number(listing.bedrooms) > 0 ? <span className="fact">{listing.bedrooms} rec.</span> : null}
          {Number(listing.bathrooms) > 0 ? <span className="fact">{listing.bathrooms} banos</span> : null}
          {Number(listing.area_m2) > 0 ? <span className="fact">{listing.area_m2} m2</span> : null}
        </div>
        <div className="card-bottom">
          <strong className="price">{money(listing.price)}</strong>
          <span className="muted">
            {listing.district}, {listing.province}
          </span>
        </div>
        <button className="primary" type="button" onClick={() => onSelect(listing)}>
          Ver detalle
        </button>
      </div>
    </article>
  );
}

function ListingDetail({ listing, onClose }) {
  const image = listing.images?.sort((a, b) => a.position - b.position)?.[0]?.url;
  const hasMap = listing.lat && listing.lng;
  const whatsapp = String(listing.whatsapp || "").replace(/\D/g, "");

  return (
    <div className="modal-wrap" style={modalWrapStyle}>
      <button type="button" style={modalBackdropStyle} onClick={onClose} aria-label="Cerrar" />
      <article className="panel" style={modalPanelStyle}>
        <div className="form-head">
          <h2>{listing.title}</h2>
          <button className="secondary" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {image ? <img className="card-image" src={image} alt={listing.title} /> : null}
        <p className="detail-description">{listing.description}</p>
        <div className="facts">
          <span className="pill">{listing.category?.name || "Sin categoria"}</span>
          <span className="pill">{listing.operation}</span>
          <span className="fact">{listing.district}, {listing.province}</span>
        </div>
        <h3 className="price">{money(listing.price)}</h3>
        <div className="admin-actions">
          {whatsapp ? (
            <a className="primary" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}
          {listing.email ? (
            <a className="secondary" href={`mailto:${listing.email}`}>
              Email
            </a>
          ) : null}
        </div>
        {hasMap ? (
          <iframe
            className="map-frame"
            title="Ubicacion"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(listing.lng) - 0.02}%2C${Number(listing.lat) - 0.02}%2C${Number(listing.lng) + 0.02}%2C${Number(listing.lat) + 0.02}&layer=mapnik&marker=${listing.lat}%2C${listing.lng}`}
          />
        ) : null}
      </article>
    </div>
  );
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const modalWrapStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  display: "grid",
  placeItems: "center",
  padding: 18
};

const modalBackdropStyle = {
  position: "absolute",
  inset: 0,
  border: 0,
  background: "rgba(9,17,22,.62)"
};

const modalPanelStyle = {
  position: "relative",
  width: "min(100%, 860px)",
  maxHeight: "92vh",
  overflow: "auto"
};
