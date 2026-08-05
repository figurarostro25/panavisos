"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { money, provinces } from "@/lib/format";
import { getSupabaseBrowser, hasSupabaseBrowserConfig } from "@/lib/supabaseBrowser";
import {
  catalogSectionCopy,
  isPropertyCategory,
  isPropertyListing
} from "@/lib/catalogSections";

const categoryLooks = {
  "bienes-raices": { icon: "BR", label: "Casas, apartamentos, lotes" },
  propiedades: { icon: "PR", label: "Venta, alquiler y lotes" },
  autos: { icon: "AU", label: "Vehiculos y accesorios" },
  vehiculos: { icon: "VH", label: "Autos, motos y repuestos" },
  servicios: { icon: "SV", label: "Negocios y profesionales" },
  empleos: { icon: "EM", label: "Vacantes y oportunidades" },
  "hojas-de-vida": { icon: "HV", label: "Talento disponible" },
  "hoja-de-vida": { icon: "HV", label: "Talento disponible" },
  marketplace: { icon: "MP", label: "Productos y ofertas" },
  "estetica-integral": { icon: "ES", label: "Belleza, bienestar y cuidado" }
};

const headerCategoryGroups = [
  { label: "Bienes Raices", terms: ["bienes", "propiedades", "inmuebles"] },
  { label: "Vehiculos", terms: ["auto", "vehiculo", "carro", "moto"] },
  { label: "Empleos y Servicios", terms: ["empleo", "servicio", "profesional"] },
  { label: "Hojas de Vida", terms: ["hoja", "curriculum", "cv"] }
];

const emptyFilters = {
  q: "",
  category: "",
  province: "",
  min: "",
  max: ""
};

export function CatalogHome({ section = "home" }) {
  const [data, setData] = useState({ categories: [], listings: [], banners: [] });
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const sectionCopy = catalogSectionCopy(section);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog");
        if (!response.ok) throw new Error("Catalog request failed");

        const payload = await response.json();
        if (!mounted) return;

        setData({
          categories: payload.categories || [],
          listings: payload.listings || [],
          banners: payload.banners || []
        });
        setCatalogError(false);
      } catch {
        if (mounted) setCatalogError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) return;

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

  const propertyCategories = useMemo(
    () => (data.categories || []).filter(isPropertyCategory),
    [data.categories]
  );
  const marketplaceCategories = useMemo(
    () => (data.categories || []).filter((category) => !isPropertyCategory(category)),
    [data.categories]
  );
  const scopedCategories =
    section === "properties"
      ? propertyCategories
      : section === "marketplace"
        ? marketplaceCategories
        : data.categories || [];
  const propertyListings = useMemo(
    () => (data.listings || []).filter(isPropertyListing),
    [data.listings]
  );
  const marketplaceListings = useMemo(
    () => (data.listings || []).filter((listing) => !isPropertyListing(listing)),
    [data.listings]
  );

  useEffect(() => {
    if (!data.categories?.length) return;
    const categorySlug = new URLSearchParams(window.location.search).get("categoria");
    if (!categorySlug) return;
    const category = data.categories.find((item) => item.slug === categorySlug);
    if (category) setFilters((current) => ({ ...current, category: category.id }));
  }, [data.categories]);

  const listings = useMemo(() => {
    const q = normalize(filters.q);
    const min = Number(filters.min || 0);
    const max = Number(filters.max || Number.MAX_SAFE_INTEGER);
    const hasExplicitFilter = Object.values(filters).some(Boolean);
    const sourceListings =
      section === "properties"
        ? propertyListings
        : section === "marketplace"
          ? marketplaceListings
          : !hasExplicitFilter && propertyListings.length
            ? propertyListings
            : data.listings || [];

    return sourceListings.filter((listing) => {
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
  }, [data.listings, filters, marketplaceListings, propertyListings, section]);

  const featured = listings.filter((listing) => listing.featured).slice(0, 6);
  const featuredListingIds = new Set(featured.map((listing) => listing.id));
  const latestListings = listings.filter((listing) => !featuredListingIds.has(listing.id));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
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
  const categoryImages = useMemo(() => {
    const images = new Map();
    (data.listings || []).forEach((listing) => {
      const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;
      if (listing.category_id && image && !images.has(listing.category_id)) {
        images.set(listing.category_id, image);
      }
    });
    return images;
  }, [data.listings]);
  const totalCategoryImage = [...categoryImages.values()][0];
  function applyCategory(categoryId = "") {
    setFilters((current) => ({ ...current, category: categoryId }));
    setMobileFiltersOpen(false);
    document.getElementById("anuncios")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitHeroSearch(event) {
    event.preventDefault();
    setMobileFiltersOpen(false);
    document.getElementById("anuncios")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((current) => (current + 1) % heroBanners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [heroBanners.length]);

  return (
    <>
      <Topbar
        profile={profile}
        categories={data.categories || []}
        section={section}
        onOpenAccount={() => setAccountOpen(true)}
        onLogout={logoutProfile}
      />
      <main className="market-home">
        {heroBanners.length ? (
          <section className="home-band hero-banner-band" aria-label="Publicidad patrocinada">
            <div className="sponsored-heading">
              <span className="sponsored-label">Publicidad</span>
              <a href="#contacto">Anuncia aqui</a>
            </div>
            <div className="hero-carousel sponsored-carousel">
              <PromoBanner banner={activeHeroBanner} />
              {heroBanners.length > 1 ? (
                <div className="banner-dots" aria-label="Anuncios patrocinados">
                  {heroBanners.map((banner, index) => (
                    <button
                      className={index === activeBanner % heroBanners.length ? "active" : ""}
                      type="button"
                      key={banner.id}
                      onClick={() => setActiveBanner(index)}
                      aria-label={`Ver publicidad ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="home-band search-hero-band">
          <div className={`search-hero search-hero-${section}`}>
            <div className="hero-copy">
              <span className="eyebrow">{sectionCopy.eyebrow}</span>
              <h1>{sectionCopy.title}</h1>
              <p>{sectionCopy.description}</p>
              <div className="hero-actions">
                <Link className="primary hero-publish" href="/publicar">{sectionCopy.primaryCta}</Link>
                <a className="hero-secondary" href="#anuncios">{sectionCopy.secondaryCta}</a>
              </div>
            </div>

            <form className="hero-search-card" onSubmit={submitHeroSearch}>
              <div className="hero-search-heading">
                <strong>{sectionCopy.searchTitle}</strong>
                <span>{sectionCopy.searchHint}</span>
              </div>
              <label className="field hero-keyword-field">
                <span>Que buscas</span>
                <input
                  value={filters.q}
                  onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                  placeholder={sectionCopy.placeholder}
                />
              </label>
              <div className="hero-search-grid">
                <label className="field">
                  <span>Categoria</span>
                  <select
                    value={filters.category}
                    onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                  >
                    <option value="">Todas</option>
                    {scopedCategories.map((category) => (
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
                    <option value="">Todo Panama</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="search-submit-row">
                <button className="primary" type="submit">Buscar anuncios</button>
                {activeFilterCount ? (
                  <button className="secondary" type="button" onClick={() => setFilters(emptyFilters)}>
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section className="home-band category-band">
          <div className="section-head">
            <div>
              <h2>{sectionCopy.categoriesTitle}</h2>
              <p>{sectionCopy.categoriesDescription}</p>
            </div>
            <div className="category-actions">
              <Link className="nav-link category-publish-link" href="/publicar">
                Publicar
              </Link>
            </div>
          </div>
          <div className="category-strip">
            <button
              className={`category-tile ${!filters.category ? "active" : ""}`}
              type="button"
              onClick={() => applyCategory("")}
            >
              <span className="category-photo">
                {totalCategoryImage ? <img src={totalCategoryImage} alt="" /> : <span>TO</span>}
              </span>
              <span>
                <strong>Todo</strong>
                <small>Ver anuncios</small>
              </span>
            </button>
            {scopedCategories.map((category) => {
              const look = categoryLooks[category.slug] || { icon: category.name.slice(0, 2) };
              const image = categoryImages.get(category.id);
              const listingCount = (data.listings || []).filter((listing) => listing.category_id === category.id).length;
              return (
                <button
                  className={`category-tile ${filters.category === category.id ? "active" : ""}`}
                  type="button"
                  key={category.id}
                  onClick={() => applyCategory(category.id)}
                >
                  <span className="category-photo">
                    {image ? <img src={image} alt="" /> : <span>{look.icon}</span>}
                  </span>
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category.description || look.label || `${listingCount} anuncios`}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="market-layout home-band" id="anuncios">
          <aside className={`market-filters ${mobileFiltersOpen ? "open" : ""}`}>
            <div className="filter-head">
              <h2>Filtrar anuncios</h2>
              <div className="filter-head-actions">
                <button
                  className="filter-reset"
                  type="button"
                  onClick={() => setFilters(emptyFilters)}
                  disabled={!activeFilterCount}
                >
                  Limpiar
                </button>
                <button className="filter-close" type="button" onClick={() => setMobileFiltersOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
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
                {scopedCategories.map((category) => (
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
                <strong>{sectionCopy.resultsTitle}</strong>
                {!loading && !catalogError ? <span className="muted"> - {listings.length} anuncios</span> : null}
              </div>
              <div className="listing-tools">
                <button
                  className="mobile-filter-toggle"
                  type="button"
                  onClick={() => setMobileFiltersOpen((current) => !current)}
                  aria-expanded={mobileFiltersOpen}
                >
                  Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
                </button>
                <div className="facts">
                  <span className="fact">Recientes</span>
                  <span className="fact">Contacto directo</span>
                </div>
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

            {catalogError ? (
              <div className="notice">No pudimos cargar los anuncios. Intenta nuevamente.</div>
            ) : latestListings.length || (!loading && listings.length === 0) ? (
              <>
                <h2 className="block-title">{section === "properties" ? "Propiedades recientes" : "Ultimos anuncios"}</h2>
                {!loading && listings.length === 0 ? (
                  <div className="notice">Todavia no hay anuncios con esos filtros.</div>
                ) : (
                  <div className="grid">
                    {latestListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} onSelect={setSelected} />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </section>
        </section>

        {section === "home" && marketplaceListings.length ? (
          <section className="home-band marketplace-preview-band" aria-labelledby="marketplace-preview-title">
            <div className="section-head">
              <div>
                <span className="eyebrow dark-eyebrow">Marketplace</span>
                <h2 id="marketplace-preview-title">Mas oportunidades cerca de ti</h2>
                <p>Vehiculos, empleos, servicios y productos publicados recientemente.</p>
              </div>
              <Link className="secondary" href="/marketplace">Ver Marketplace</Link>
            </div>
            <div className="grid marketplace-preview-grid">
              {marketplaceListings.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} onSelect={setSelected} />
              ))}
            </div>
          </section>
        ) : null}

        {overflowBanners.length ? (
          <section className="home-band sponsored-band" aria-labelledby="sponsored-title">
            <div className="section-head">
              <div>
                <h2 id="sponsored-title">Mas promociones</h2>
                <p>Espacios patrocinados activos.</p>
              </div>
            </div>
            <div className="sponsored-layout">
              <section className="featured-promos sponsored-rail" aria-label="Mas promociones">
                <div className="rail-head">
                  <h2>Patrocinados</h2>
                  <small>Promociones activas</small>
                </div>
                <div className="promo-rail">
                  {overflowBanners.map((banner) => <PromoBanner key={banner.id} banner={banner} compact />)}
                </div>
              </section>
            </div>
          </section>
        ) : null}

        <section className="home-band feedback-band" id="contacto">
          <FeedbackForm profile={profile} />
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

function Topbar({ profile, categories = [], section, onOpenAccount, onLogout }) {
  const menuCategories = headerCategoryGroups
    .map((group) => {
      const category = categories.find((item) => {
        const haystack = normalize(`${item.slug} ${item.name}`);
        return group.terms.some((term) => haystack.includes(normalize(term)));
      });
      return category ? { ...group, category } : null;
    })
    .filter(Boolean);

  return (
    <header className="topbar marketplace-topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav className="main-menu" aria-label="Categorias principales">
          <Link className={section === "properties" ? "active" : ""} href="/propiedades">
            Propiedades
          </Link>
          {menuCategories.filter((item) => !isPropertyCategory(item.category)).map((item) => (
            <Link key={item.label} href={`/marketplace?categoria=${item.category.slug}`}>
              {item.label}
            </Link>
          ))}
          <Link className={section === "marketplace" ? "active" : ""} href="/marketplace">
            Marketplace
          </Link>
        </nav>
        <nav className="top-actions">
          <a className="desktop-top-link" href="#anuncios">Anuncios</a>
          <Link className="desktop-top-link" href="/cuenta">Mi cuenta</Link>
          <AccountButton profile={profile} onOpen={onOpenAccount} onLogout={onLogout} />
          <Link className="primary publish-cta" href="/publicar">
            Publicar
          </Link>
        </nav>
      </div>
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
  const [sessionProfile, setSessionProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingAuth, setSavingAuth] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        setLoadingAccount(false);
        return;
      }

      const metadata = data.session.user.user_metadata || {};
      const { data: savedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .maybeSingle();

      setSessionProfile({
        id: data.session.user.id,
        name: savedProfile?.full_name || metadata.full_name || metadata.name || data.session.user.email,
        email: data.session.user.email,
        phone: savedProfile?.phone || "",
        avatar: savedProfile?.avatar_url || metadata.avatar_url || metadata.picture || ""
      });

      const response = await fetch("/api/account/listings", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });
      const payload = await response.json().catch(() => ({}));
      setMyListings(payload.listings || []);
      setLoadingAccount(false);
    }

    loadAccount();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (authMode === "register" && !form.name.trim()) {
      setError("Escribe tu nombre completo para crear la cuenta.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (authMode === "register" && form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    try {
      setSavingAuth(true);
      const supabase = getSupabaseBrowser();
      const result =
        authMode === "register"
          ? await supabase.auth.signUp({
              email: form.email,
              password: form.password,
              options: {
                emailRedirectTo: window.location.origin,
                data: { full_name: form.name.trim() }
              }
            })
          : await supabase.auth.signInWithPassword({
              email: form.email,
              password: form.password
            });

      if (result.error) {
        setError(authErrorMessage(result.error.message));
        return;
      }

      setMessage(authMode === "register" ? "Cuenta creada. Si se requiere confirmacion, revisa tu correo antes de entrar." : "Sesion iniciada.");
      if (authMode === "login") window.location.href = "/cuenta";
    } catch {
      setError("No pudimos completar el acceso ahora. Revisa tus datos e intenta nuevamente.");
    } finally {
      setSavingAuth(false);
    }
  }

  async function sendRecoveryLink() {
    setMessage("");
    setError("");

    if (!form.email) {
      setError("Escribe tu correo para enviarte la recuperacion.");
      return;
    }

    try {
      setSavingAuth(true);
      const { error: recoveryError } = await getSupabaseBrowser().auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin
      });

      if (recoveryError) {
        setError(authErrorMessage(recoveryError.message));
        return;
      }

      setMessage("Te enviamos un enlace para recuperar tu contrasena.");
    } catch {
      setError("No pudimos enviar la recuperacion ahora.");
    } finally {
      setSavingAuth(false);
    }
  }

  async function loginWithGoogle() {
    setMessage("");
    setError("");

    try {
      setSavingAuth(true);
      const { error: googleError } = await getSupabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/cuenta`
        }
      });

      if (googleError) {
        setError(authErrorMessage(googleError.message));
      }
    } catch {
      setError("Google todavia no esta conectado en Supabase.");
    } finally {
      setSavingAuth(false);
    }
  }

  return (
    <div className="account-modal">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Cerrar" />
      <section className="account-dialog">
        <button className="modal-close account-close" type="button" onClick={onClose} aria-label="Cerrar">
          X
        </button>
        {loadingAccount ? (
          <div className="account-column account-primary-panel">
            <span className="account-kicker">Cuenta PanAvisos</span>
            <h2>Cargando cuenta...</h2>
          </div>
        ) : sessionProfile ? (
          <AccountQuickPanel profile={sessionProfile} listings={myListings} onClose={onClose} />
        ) : (
          <>
            <div className="account-column account-primary-panel">
          <span className="account-kicker">Cuenta PanAvisos</span>
          <h2>{authMode === "register" ? "Crea tu cuenta" : "Inicia sesion"}</h2>
          <p className="muted account-copy">
            {authMode === "register"
              ? "Crea tu perfil con nombre, correo y contrasena para publicar o responder anuncios."
              : "Entra con tu correo y contrasena."}
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
            <label className="field">
              <span>Contrasena</span>
              <input
                required
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Minimo 6 caracteres"
              />
            </label>
            {authMode === "register" ? (
              <label className="field">
                <span>Confirmar contrasena</span>
                <input
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  placeholder="Repite tu contrasena"
                />
              </label>
            ) : null}
            <button className="primary wide-button" type="submit" disabled={savingAuth}>
              {savingAuth ? (authMode === "register" ? "Creando cuenta..." : "Entrando...") : authMode === "register" ? "Crear cuenta" : "Iniciar sesion"}
            </button>
            {authMode === "login" ? (
              <button className="text-button" type="button" onClick={sendRecoveryLink} disabled={savingAuth}>
                Olvidaste tu contrasena?
              </button>
            ) : null}
            {message ? <p className="notice inline-auth-message">{message}</p> : null}
            {error ? <p className="error inline-auth-message">{error}</p> : null}
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
        </div>
            <div className="account-column account-secondary-panel">
              <h2>Acceso social</h2>
              <p className="muted account-copy">Google ya queda listo para usarse cuando el proveedor este activo en Supabase.</p>
              <div className="social-disabled-group" aria-label="Opciones de acceso social">
                <button className="facebook-button" type="button" disabled>
                  Facebook proximamente
                </button>
                <button className="google-button-solid active" type="button" onClick={loginWithGoogle} disabled={savingAuth}>
                  Continuar con Google
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function AccountQuickPanel({ profile, listings, onClose }) {
  const activeCount = listings.filter((listing) => listing.status === "active").length;
  const pendingCount = listings.filter((listing) => listing.status === "pending").length;

  return (
    <>
      <div className="account-column account-primary-panel user-menu-panel">
        <span className="account-kicker">Mi cuenta</span>
        <div className="profile-summary">
          {profile.avatar ? (
            <img className="profile-photo" src={profile.avatar} alt="" />
          ) : (
            <span className="avatar large-avatar">{initials(profile.name || profile.email)}</span>
          )}
          <div>
            <h2>{profile.name}</h2>
            <p className="muted account-copy">{profile.email}</p>
          </div>
        </div>
        <div className="account-stats compact-stats">
          <span><strong>{listings.length}</strong> anuncios</span>
          <span><strong>{activeCount}</strong> activos</span>
          <span><strong>{pendingCount}</strong> pendientes</span>
        </div>
        <div className="account-actions">
          <Link className="primary" href="/publicar" onClick={onClose}>
            Publicar otro
          </Link>
          <Link className="secondary" href="/cuenta" onClick={onClose}>
            Ver mi panel
          </Link>
        </div>
      </div>
      <div className="account-column account-secondary-panel user-listings-panel">
        <h2>Mis anuncios</h2>
        {listings.length ? (
          <div className="mini-listing-list">
            {listings.slice(0, 5).map((listing) => (
              <MiniListing key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="muted account-copy">Todavia no tienes anuncios publicados.</p>
        )}
      </div>
    </>
  );
}

function MiniListing({ listing }) {
  const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <article className="mini-listing">
      {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">PA</span>}
      <div>
        <strong>{listing.title}</strong>
        <small>{money(listing.price)} - {statusLabel(listing.status)}</small>
        <Link href={`/publicar?edit=${listing.id}`}>Editar</Link>
      </div>
    </article>
  );
}

function statusLabel(status) {
  const labels = {
    active: "Activo",
    pending: "Pendiente",
    inactive: "Pausado",
    rejected: "Rechazado"
  };
  return labels[status] || "Pendiente";
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
  const title = cleanBannerText(content.title);
  const subtitle = cleanBannerText(content.subtitle);
  const hasArtwork = Boolean(content.image_url);
  const artworkOnly = hasArtwork && !title && !subtitle;

  return (
    <Wrapper
      className={`promo-banner ${large ? "large" : ""} ${compact ? "compact" : ""} ${hasArtwork ? "has-image" : ""} ${artworkOnly ? "artwork-only" : ""}`}
      aria-label={title || subtitle || content.cta_label || "Publicidad destacada"}
      {...wrapperProps}
    >
      {content.image_url ? <img src={content.image_url} alt="" /> : null}
      {!artworkOnly ? <div>
        <span className="eyebrow">Destacado</span>
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p>{subtitle}</p> : null}
        {content.cta_label && content.cta_url ? (
          <span className="secondary">
            {content.cta_label}
          </span>
        ) : null}
      </div> : null}
    </Wrapper>
  );
}

function cleanBannerText(value) {
  const text = String(value || "").trim();
  return /[A-Za-z0-9\u00c0-\u024f]/.test(text) ? text : "";
}

function authErrorMessage(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("already registered") || text.includes("already exists")) {
    return "Ese correo ya tiene cuenta. Prueba iniciar sesion.";
  }
  if (text.includes("invalid login credentials")) {
    return "Correo o contrasena incorrectos.";
  }
  if (text.includes("email not confirmed")) {
    return "Falta confirmar tu correo. Revisa tu email.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "No pudimos conectar con Supabase. Revisa en Vercel que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY esten completas en Production, y redeploya.";
  }
  if (text.includes("password")) {
    return "Revisa la contrasena. Debe tener al menos 6 caracteres.";
  }
  return value || "No pudimos completar la accion.";
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
  const [copied, setCopied] = useState(false);
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

  async function copyListingLink() {
    const url = `${window.location.origin}/anuncio/${listing.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
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
              <Link className="secondary" href={`/anuncio/${listing.slug}`}>
                Abrir anuncio
              </Link>
              <button className="secondary" type="button" onClick={copyListingLink}>
                {copied ? "Link copiado" : "Copiar link"}
              </button>
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
              {listing.video_url ? (
                <a className="secondary" href={listing.video_url} target="_blank" rel="noreferrer">
                  Video
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

            {listing.user_id ? (
              <div className="seller-panel compact-seller-panel">
                <span className="avatar-badge">{initials(listing.profile?.full_name || listing.advertiser_name || "PA")}</span>
                <div>
                  <h3>{listing.profile?.full_name || listing.advertiser_name || "Anunciante PanAvisos"}</h3>
                  <Link className="secondary compact-link" href={`/vendedor/${listing.user_id}`}>
                    Ver mas anuncios
                  </Link>
                </div>
              </div>
            ) : null}

            <FeedbackForm profile={profile} listing={listing} compact />
          </div>
        </aside>
      </article>
    </div>
  );
}

function FeedbackForm({ profile, listing = null, compact = false }) {
  const sellerPhone = String(listing?.whatsapp || listing?.advertiser_phone || listing?.profile?.phone || "").replace(/\D/g, "");
  const initialMessage = listing
    ? `Me interesa el anuncio "${listing.title}" que tienes publicado en PanAvisos.`
    : "";
  const [form, setForm] = useState({
    kind: listing ? "inquiry" : "feedback",
    sender_name: profile?.name || "",
    sender_email: profile?.email || "",
    sender_phone: "",
    subject: listing ? `Mensaje sobre: ${listing.title}` : "",
    message: initialMessage
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      sender_name: current.sender_name || profile?.name || "",
      sender_email: current.sender_email || profile?.email || ""
    }));
  }, [profile]);

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    setSending(true);

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        listing_id: listing?.id || null,
        listing_title: listing?.title || null
      })
    });

    const payload = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      setError(payload.error || "No pudimos enviar el mensaje.");
      return;
    }

    setStatus(listing ? "Consulta enviada. El anunciante la recibira en PanAvisos." : "Mensaje enviado. Gracias, lo revisaremos pronto.");
    setForm((current) => ({ ...current, subject: listing ? current.subject : "", message: listing ? initialMessage : "" }));
  }

  if (listing) {
    const sellerDial = sellerPhone ? (sellerPhone.startsWith("507") ? sellerPhone : `507${sellerPhone}`) : "";
    const whatsappText = encodeURIComponent(form.message || initialMessage);
    return (
      <section className={`seller-contact-card ${compact ? "compact" : ""}`}>
        <div>
          <span className="eyebrow">Consulta directa</span>
          <h2>Enviar consulta</h2>
          <p className="muted">Deja tus datos y el mensaje llega a la bandeja de PanAvisos.</p>
        </div>
        <form onSubmit={submit}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              value={form.sender_name}
              onChange={(event) => setForm({ ...form, sender_name: event.target.value })}
              placeholder="Tu nombre"
            />
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
              <input
                value={form.sender_phone}
                onChange={(event) => setForm({ ...form, sender_phone: event.target.value })}
                placeholder="6000-0000"
              />
            </label>
          </div>
          <label className="field">
            <span>Mensaje</span>
            <textarea
              required
              rows={compact ? 4 : 5}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Escribe tu consulta"
            />
          </label>
          <button className="primary inquiry-submit" type="submit" disabled={sending}>
            {sending ? "Enviando..." : "Enviar consulta"}
          </button>
          <div className="contact-shortcuts">
            {sellerPhone ? (
              <a className="phone-action" href={`tel:+${sellerDial}`}>
                Llamar
              </a>
            ) : (
              <span className="disabled-contact-action">Llamar</span>
            )}
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

  return (
    <section className={`feedback-panel ${compact ? "compact" : ""}`}>
      <div>
        <span className="eyebrow">{listing ? "Reportar o consultar" : "Contacto"}</span>
        <h2>{listing ? "Enviar mensaje sobre este anuncio" : "Cuéntanos cómo va PanAvisos"}</h2>
        <p className="muted">
          {listing
            ? "Usa este espacio para reportar algo, pedir ayuda o dejar una observacion."
            : "Recibimos feedback, reportes y mensajes para mejorar la plataforma."}
        </p>
      </div>
      <form onSubmit={submit}>
        <div className="field-row">
          <label className="field">
            <span>Tipo</span>
            <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
              <option value="feedback">Feedback</option>
              <option value="report">Denuncia</option>
              <option value="support">Ayuda</option>
              <option value="lead">Quiero anunciarme</option>
            </select>
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
        </div>
        <div className="field-row">
          <label className="field">
            <span>Nombre</span>
            <input
              value={form.sender_name}
              onChange={(event) => setForm({ ...form, sender_name: event.target.value })}
              placeholder="Tu nombre"
            />
          </label>
          <label className="field">
            <span>WhatsApp opcional</span>
            <input
              value={form.sender_phone}
              onChange={(event) => setForm({ ...form, sender_phone: event.target.value })}
              placeholder="6000-0000"
            />
          </label>
        </div>
        <label className="field">
          <span>Asunto</span>
          <input
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            placeholder="Resumen corto"
          />
        </label>
        <label className="field">
          <span>Mensaje</span>
          <textarea
            required
            rows={compact ? 3 : 4}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Escribe tu mensaje"
          />
        </label>
        <button className="primary" type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar mensaje"}
        </button>
        {status ? <p className="notice inline-auth-message">{status}</p> : null}
        {error ? <p className="error inline-auth-message">{error}</p> : null}
      </form>
    </section>
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
