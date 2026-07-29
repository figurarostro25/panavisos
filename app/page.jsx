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
              <Link className="primary" href="/publicar">
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
            <Link className="nav-link" href="/publicar">
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
        <Link href="/admin">Admin</Link>
        <Link className="primary" href="/publicar">
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
  const images = [...(listing.images || [])].sort((a, b) => a.position - b.position);
  const image = images[0]?.url;
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";

  return (
    <article className="card marketplace-card">
      <button className="card-image-button" type="button" onClick={() => onSelect(listing)}>
        {image ? (
          <img className="card-image" src={image} alt={listing.title} />
        ) : (
          <div className="card-image empty-image">PA</div>
        )}
      </button>
      <div className="card-body">
        {listing.featured ? <span className="fresh-badge">Recien publicado</span> : null}
        <PriceBlock listing={listing} />
        <button className="listing-title-button" type="button" onClick={() => onSelect(listing)}>
          {listing.title}
        </button>
        <span className="card-location">
          {listing.district}, {listing.province}
        </span>
        {showRealEstateFacts ? (
          <div className="facts compact-facts">
            {Number(listing.bedrooms) > 0 ? <span className="fact">{listing.bedrooms} rec.</span> : null}
            {Number(listing.bathrooms) > 0 ? <span className="fact">{listing.bathrooms} banos</span> : null}
            {Number(listing.area_m2) > 0 ? <span className="fact">{listing.area_m2} m2</span> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ListingDetail({ listing, onClose }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = [...(listing.images || [])].sort((a, b) => a.position - b.position);
  const image = images[activeImage]?.url;
  const hasMap = listing.lat && listing.lng;
  const whatsapp = String(listing.whatsapp || "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(`Hola, vi este anuncio en PanAvisos: ${listing.title}. Sigue disponible?`);
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";

  function moveImage(direction) {
    if (!images.length) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  return (
    <div className="listing-modal">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Cerrar" />
      <article className="listing-dialog">
        <section className="listing-gallery">
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
            X
          </button>
          <div className="gallery-stage">
            {image ? <img src={image} alt={listing.title} /> : <div className="empty-image gallery-empty">PA</div>}
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
        </section>

        <aside className="listing-info">
          <div className="listing-info-scroll">
            <h2>{listing.title}</h2>
            <PriceBlock listing={listing} large />
            <p className="muted">Publicado en {listing.district}, {listing.province}</p>

            <div className="detail-actions">
              {whatsapp ? (
                <a
                  className="primary"
                  href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar mensaje
                </a>
              ) : null}
              {listing.website_url ? (
                <a className="secondary" href={listing.website_url} target="_blank" rel="noreferrer">
                  Sitio web
                </a>
              ) : null}
              {listing.email ? (
                <a className="secondary" href={`mailto:${listing.email}`}>
                  Email
                </a>
              ) : null}
            </div>

            <h3>Detalles</h3>
            <dl className="detail-list">
              <div>
                <dt>Categoria</dt>
                <dd>{listing.category?.name || "Sin categoria"}</dd>
              </div>
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

            <h3>Descripcion</h3>
            <p className="detail-description">{listing.description}</p>

            <h3>Ubicacion</h3>
            <p className="muted">
              {listing.address_reference || `${listing.district}, ${listing.province}`}
            </p>
            {hasMap ? (
              <a
                className="secondary location-link"
                href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver ubicacion aproximada
              </a>
            ) : null}
          </div>
        </aside>
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

function PriceBlock({ listing, large = false }) {
  const hasDiscount = Number(listing.original_price) > Number(listing.price || 0);
  return (
    <div className={`price-stack ${large ? "large" : ""}`}>
      {hasDiscount ? <span className="old-price">{money(listing.original_price)}</span> : null}
      <strong className={large ? "detail-price" : "price"}>{money(listing.price)}</strong>
      {hasDiscount && listing.discount_percent ? <span className="discount-badge">{listing.discount_percent}% menos</span> : null}
    </div>
  );
}
