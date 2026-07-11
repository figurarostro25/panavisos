"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { money, provinces } from "@/lib/format";

const categoryLooks = {
  "bienes-raices": { icon: "BR", label: "Casas, apartamentos, lotes" },
  autos: { icon: "AU", label: "Vehiculos y accesorios" },
  servicios: { icon: "SV", label: "Negocios y profesionales" }
};

export default function HomePage() {
  const [data, setData] = useState({ categories: [], listings: [], banners: [] });
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

  const featured = listings.filter((listing) => listing.featured).slice(0, 6);
  const primaryBanner = data.banners?.[0];
  const secondaryBanners = (data.banners || []).slice(1, 3);

  return (
    <>
      <Topbar />
      <main>
        <section className="market-hero">
          <div className="hero-copy">
            <span className="eyebrow">Marketplace de Panama</span>
            <h1>Compra, vende y promociona cerca de ti.</h1>
            <p>
              Propiedades, autos, servicios y ofertas locales con busqueda sencilla y contacto directo.
            </p>
            <div className="hero-actions">
              <Link className="primary" href="/admin">
                Publicar anuncio
              </Link>
              <a className="secondary" href="#anuncios">
                Explorar
              </a>
            </div>
          </div>
          <form className="hero-search" onSubmit={(event) => event.preventDefault()}>
            <label className="field">
              <span>Que buscas?</span>
              <input
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                placeholder="Ej: apartamento, estetica, Toyota..."
              />
            </label>
            <div className="field-row">
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
            </div>
          </form>
        </section>

        <section className="home-band">
          <div className="section-head">
            <div>
              <h2>Categorias populares</h2>
              <p className="muted">Entrada rapida al estilo marketplace para navegar sin aprender nada nuevo.</p>
            </div>
            <Link className="nav-link" href="/admin">
              Publicar
            </Link>
          </div>
          <div className="category-strip">
            <button className="category-tile" type="button" onClick={() => setFilters({ ...filters, category: "" })}>
              <span className="category-icon">TO</span>
              <strong>Todo</strong>
              <small>Ver anuncios</small>
            </button>
            {data.categories?.map((category) => {
              const look = categoryLooks[category.slug] || { icon: category.name.slice(0, 2), label: category.description };
              return (
                <button
                  className="category-tile"
                  type="button"
                  key={category.id}
                  onClick={() => setFilters({ ...filters, category: category.id })}
                >
                  <span className="category-icon">{look.icon}</span>
                  <strong>{category.name}</strong>
                  <small>{look.label}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="home-band banner-grid">
          <PromoBanner banner={primaryBanner} large />
          <div className="side-promos">
            {secondaryBanners.length ? (
              secondaryBanners.map((banner) => <PromoBanner key={banner.id} banner={banner} />)
            ) : (
              <>
                <PromoBanner banner={{ title: "Destaca tu negocio", subtitle: "Banners administrables para promociones." }} />
                <PromoBanner banner={{ title: "Anuncios premium", subtitle: "Espacio para ofertas, proyectos y campanas." }} />
              </>
            )}
          </div>
        </section>

        <section className="market-layout home-band" id="anuncios">
          <aside className="market-filters">
            <h2>Filtrar anuncios</h2>
            <label className="field">
              <span>Buscar</span>
              <input
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                placeholder="Palabra clave"
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

          <section className="market-results">
            <div className="toolbar">
              <div>
                <strong>{loading ? "Cargando..." : `${listings.length} anuncios`}</strong>
                <span className="muted"> disponibles</span>
              </div>
              <div className="facts">
                <span className="fact">Recientes</span>
                <span className="fact">Contacto directo</span>
              </div>
            </div>

            {featured.length ? (
              <>
                <h2 className="block-title">Destacados</h2>
                <div className="grid compact-grid">
                  {featured.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} onSelect={setSelected} />
                  ))}
                </div>
              </>
            ) : null}

            <h2 className="block-title">Ultimos anuncios</h2>
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
        </section>
      </main>

      {selected ? <ListingDetail listing={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function Topbar() {
  return (
    <header className="topbar marketplace-topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">PA</span>
        <span>
          <strong>PanAvisos</strong>
          <small>Anuncios de Panama</small>
        </span>
      </Link>
      <nav className="top-actions">
        <a href="#anuncios">Anuncios</a>
        <Link href="/admin">Mi cuenta</Link>
        <Link className="primary" href="/admin">
          Publicar
        </Link>
      </nav>
    </header>
  );
}

function PromoBanner({ banner, large = false }) {
  const content = banner || {
    title: "Promociona aqui",
    subtitle: "Crea banners desde el panel admin y mostrarlos en portada.",
    cta_label: "Administrar",
    cta_url: "/admin"
  };

  return (
    <article className={`promo-banner ${large ? "large" : ""}`}>
      {content.image_url ? <img src={content.image_url} alt="" /> : null}
      <div>
        <span className="eyebrow">Destacado</span>
        <h2>{content.title}</h2>
        {content.subtitle ? <p>{content.subtitle}</p> : null}
        {content.cta_label && content.cta_url ? (
          <a className="secondary" href={content.cta_url}>
            {content.cta_label}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ListingCard({ listing, onSelect }) {
  const image = listing.images?.sort((a, b) => a.position - b.position)?.[0]?.url;

  return (
    <article className="card marketplace-card">
      {image ? <img className="card-image" src={image} alt={listing.title} /> : <div className="card-image empty-image">PA</div>}
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
