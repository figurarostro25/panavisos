"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { money, provinces } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

const categoryLooks = {
  "bienes-raices": { icon: "BR", label: "Casas, apartamentos, lotes" },
  autos: { icon: "AU", label: "Vehiculos y accesorios" },
  servicios: { icon: "SV", label: "Negocios y profesionales" }
};

export default function HomePage() {
  const [data, setData] = useState({ categories: [], listings: [], banners: [] });
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
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

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      await hydrateProfile(data.session);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateProfile(session);
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function hydrateProfile(session) {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    const supabase = getSupabaseBrowser();
    const { data: savedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    const metadata = session.user.user_metadata || {};

    setProfile({
      id: session.user.id,
      name: savedProfile?.full_name || metadata.full_name || metadata.name || session.user.email,
      email: session.user.email,
      age: savedProfile?.age || "",
      avatar: savedProfile?.avatar_url || metadata.avatar_url || metadata.picture || "",
      provider: session.user.app_metadata?.provider || "email"
    });
    setAccountOpen(false);
  }

  async function logoutProfile() {
    await getSupabaseBrowser().auth.signOut();
    setProfile(null);
  }

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
  const sortedBanners = useMemo(
    () =>
      [...(data.banners || [])].sort(
        (a, b) =>
          new Date(b.created_at || b.starts_at || 0).getTime() -
          new Date(a.created_at || a.starts_at || 0).getTime()
      ),
    [data.banners]
  );
  const heroBanners = sortedBanners.slice(0, 5);
  const overflowBanners = sortedBanners.slice(5);
  const activeHeroBanner = heroBanners[activeBanner % Math.max(heroBanners.length, 1)];

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((current) => (current + 1) % heroBanners.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [heroBanners.length]);

  return (
    <>
      <Topbar profile={profile} onOpenAccount={() => setAccountOpen(true)} onLogout={logoutProfile} />
      <main className="market-home">
        <section className="home-band hero-banner-band">
          <div className="hero-carousel">
            <PromoBanner banner={activeHeroBanner} large />
            {heroBanners.length > 1 ? (
              <div className="banner-dots" aria-label="Banners principales">
                {heroBanners.map((banner, index) => (
                  <button
                    className={index === activeBanner % heroBanners.length ? "active" : ""}
                    type="button"
                    key={banner.id}
                    onClick={() => setActiveBanner(index)}
                    aria-label={`Ver banner ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
          {overflowBanners.length ? (
            <section className="featured-promos" aria-label="Destacados">
              <div className="rail-head">
                <h2>Destacados</h2>
                <small>Promociones activas</small>
              </div>
              <div className="promo-rail">
                {overflowBanners.map((banner) => <PromoBanner key={banner.id} banner={banner} compact />)}
              </div>
            </section>
          ) : null}
        </section>

        <section className="home-band category-band">
          <div className="section-head">
            <div>
              <h2>Categorias populares</h2>
            </div>
            <div className="category-actions">
              <label className="quick-search">
                <span className="sr-only">Buscar anuncios</span>
                <input
                  value={filters.q}
                  onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                  placeholder="Buscar..."
                />
              </label>
              <Link className="nav-link" href="/publicar">
                Publicar
              </Link>
            </div>
          </div>
          <div className="category-strip">
            <button className="category-tile" type="button" onClick={() => setFilters({ ...filters, category: "" })}>
              <span className="category-icon">TO</span>
              <strong>Todo</strong>
            </button>
            {data.categories?.map((category) => {
              const look = categoryLooks[category.slug] || { icon: category.name.slice(0, 2) };
              return (
                <button
                  className="category-tile"
                  type="button"
                  key={category.id}
                  onClick={() => setFilters({ ...filters, category: category.id })}
                >
                  <span className="category-icon">{look.icon}</span>
                  <strong>{category.name}</strong>
                </button>
              );
            })}
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

      <SiteFooter />
      {selected ? (
        <ListingDetail
          listing={selected}
          profile={profile}
          onRequireAccount={() => setAccountOpen(true)}
          onClose={() => setSelected(null)}
        />
      ) : null}
      {accountOpen ? <AccountModal onClose={() => setAccountOpen(false)} /> : null}
    </>
  );
}

function Topbar({ profile, onOpenAccount, onLogout }) {
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
        <Link href="/admin">Dashboard</Link>
        <AccountButton profile={profile} onOpen={onOpenAccount} onLogout={onLogout} />
        <Link className="primary" href="/publicar">
          Publicar
        </Link>
      </nav>
    </header>
  );
}

function AccountButton({ profile, onOpen, onLogout }) {
  if (profile) {
    return (
      <div className="account-chip">
        <button className="profile-button" type="button" onClick={onOpen}>
          <span className="avatar">{initials(profile.name || profile.email)}</span>
          <span>{profile.name}</span>
        </button>
        <button className="icon-link" type="button" onClick={onLogout} aria-label="Salir de cuenta">
          Salir
        </button>
      </div>
    );
  }

  return (
    <button className="account-icon-button" type="button" onClick={onOpen} aria-label="Entrar o registrarse">
      <span className="avatar">PA</span>
      <span>Entrar</span>
    </button>
  );
}

function AccountModal({ onClose }) {
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (authMode === "register" && !form.name.trim()) {
      setError("Escribe tu nombre completo para crear la cuenta.");
      return;
    }

    try {
      const supabase = getSupabaseBrowser();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: form.email,
        options: {
          emailRedirectTo: window.location.origin,
          data: form.name.trim() ? { full_name: form.name.trim() } : undefined
        }
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setMessage(authMode === "register" ? "Te enviamos un enlace para confirmar tu cuenta." : "Te enviamos un enlace de acceso al correo.");
    } catch {
      setError("No pudimos enviar el enlace ahora. Revisa el correo e intenta nuevamente.");
    }
  }

  return (
    <div className="account-modal">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Cerrar" />
      <section className="account-dialog">
        <button className="modal-close account-close" type="button" onClick={onClose} aria-label="Cerrar">
          X
        </button>
        <div className="account-column account-primary-panel">
          <span className="account-kicker">Cuenta PanAvisos</span>
          <h2>{authMode === "register" ? "Crea tu cuenta" : "Inicia sesion"}</h2>
          <p className="muted account-copy">
            {authMode === "register"
              ? "Crea tu perfil con nombre y correo para publicar o responder anuncios."
              : "Entra con tu correo. Te enviaremos un enlace seguro sin contrasena."}
          </p>
          <form onSubmit={submit}>
            {authMode === "register" ? (
              <label className="field">
                <span>Nombre completo</span>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tu nombre" />
              </label>
            ) : null}
            <label className="field">
              <span>Correo</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="correo@email.com"
              />
            </label>
            <button className="primary wide-button" type="submit">
              {authMode === "register" ? "Crear cuenta por correo" : "Enviar enlace de acceso"}
            </button>
          </form>
          <div className="auth-switch">
            {authMode === "register" ? (
              <>
                <span>Ya tienes cuenta?</span>
                <button type="button" onClick={() => setAuthMode("login")}>
                  Inicia sesion
                </button>
              </>
            ) : (
              <>
                <span>Aun no tienes cuenta?</span>
                <button type="button" onClick={() => setAuthMode("register")}>
                  Crear cuenta
                </button>
              </>
            )}
          </div>
          {message ? <p className="notice">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
        <div className="account-column account-secondary-panel">
          <h2>Acceso social</h2>
          <p className="muted account-copy">Google y Facebook quedaran disponibles cuando conectemos sus credenciales reales.</p>
          <div className="social-disabled-group" aria-label="Opciones disponibles proximamente">
            <button className="facebook-button" type="button" disabled>
              Facebook proximamente
            </button>
            <button className="google-button-solid" type="button" disabled>
              Google proximamente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PromoBanner({ banner, large = false, compact = false }) {
  const content = banner || {
    title: "Promociona aqui",
    subtitle: "Crea banners desde el panel admin y mostrarlos en portada.",
    cta_label: "Publicar ahora",
    cta_url: "/publicar"
  };
  const Wrapper = content.cta_url ? "a" : "article";
  const wrapperProps = content.cta_url
    ? { href: content.cta_url, target: content.cta_url.startsWith("http") ? "_blank" : undefined, rel: content.cta_url.startsWith("http") ? "noreferrer" : undefined }
    : {};

  return (
    <Wrapper className={`promo-banner ${large ? "large" : ""} ${compact ? "compact" : ""}`} {...wrapperProps}>
      {content.image_url ? <img src={content.image_url} alt="" /> : null}
      <div>
        <span className="eyebrow">{content.ends_at ? `Vigente hasta ${formatDate(content.ends_at)}` : "Destacado"}</span>
        <h2>{content.title}</h2>
        {content.subtitle ? <p>{content.subtitle}</p> : null}
        {content.cta_label && content.cta_url ? (
          <span className="secondary">
            {content.cta_label}
          </span>
        ) : null}
      </div>
    </Wrapper>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>PanAvisos</strong>
        <p>Publicaciones locales para comprar, vender y promocionar en Panama.</p>
      </div>
      <nav>
        <Link href="/terminos">Terminos</Link>
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/publicar">Publicar</Link>
      </nav>
    </footer>
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

function ListingDetail({ listing, profile, onRequireAccount, onClose }) {
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
                profile ? (
                  <a
                    className="primary"
                    href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar mensaje
                  </a>
                ) : (
                  <button className="primary" type="button" onClick={onRequireAccount}>
                    Registrate para responder
                  </button>
                )
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

function formatDate(value) {
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
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

function initials(value) {
  const text = String(value || "PA").trim();
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
