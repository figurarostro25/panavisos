"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { money, provinces, whatsappDialNumber } from "@/lib/format";
import { optimizeImageUrl } from "@/lib/images";
import { distanceInKm, nearestKnownLocation, searchAreaOptions } from "@/lib/locations";
import { completeOAuthRedirect, getSupabaseBrowser, hasSupabaseBrowserConfig } from "@/lib/supabaseBrowser";
import { getAuthRedirectOrigin } from "@/lib/site";
import { readCachedCategories, writeCachedCategories } from "@/lib/categoryCache";
import {
  catalogSectionCopy,
  isPropertyCategory,
  isPropertyListing,
  isServiceCategory
} from "@/lib/catalogSections";

const categoryLooks = {
  "bienes-raices": { icon: "BR", label: "Casas, apartamentos, lotes" },
  propiedades: { icon: "PR", label: "Venta, alquiler y lotes" },
  autos: { icon: "AU", label: "Vehículos y accesorios" },
  vehiculos: { icon: "VH", label: "Autos, motos y repuestos" },
  servicios: { icon: "SV", label: "Negocios y profesionales" },
  empleos: { icon: "EM", label: "Vacantes y oportunidades" },
  "hojas-de-vida": { icon: "HV", label: "Talento disponible" },
  "hoja-de-vida": { icon: "HV", label: "Talento disponible" },
  marketplace: { icon: "MP", label: "Productos y ofertas" },
  "estetica-integral": { icon: "ES", label: "Belleza, bienestar y cuidado" }
};

const headerCategoryGroups = [
  { label: "Bienes raíces", terms: ["bienes", "propiedades", "inmuebles"] },
  { label: "Servicios", terms: ["empleo", "servicio", "profesional", "trabajo"] },
  { label: "Marketplace", terms: ["auto", "vehiculo", "carro", "moto", "producto", "marketplace"] },
  { label: "Hojas de Vida", terms: ["hoja", "curriculum", "cv"] }
];

const emptyFilters = {
  q: "",
  category: "",
  province: "",
  min: "",
  max: ""
};

const catalogCacheKey = "panavisos-public-catalog-v1";
const searchAreaCacheKey = "panavisos-search-area-v1";

function listingMatchesSearchArea(listing, area) {
  if (!area) return true;

  const listingDistance = distanceInKm(area.lat, area.lng, listing.lat, listing.lng);
  if (listingDistance != null) return listingDistance <= Number(area.radius || 100);

  // Los anuncios anteriores a esta mejora siguen visibles por provincia.
  return listing.province === area.province;
}
const catalogRetryDelays = [0, 700, 1800];
const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const popularNeeds = [
  { label: "Propiedades", terms: ["bienes", "propiedad", "inmueble"], slug: "bienes-raices", detail: "Vende o alquila" },
  { label: "Autos y motos", terms: ["auto", "vehiculo", "carro", "moto"], slug: "autos", detail: "Publica tu vehículo" },
  { label: "Empleos", terms: ["empleo", "vacante"], slug: "empleos", detail: "Publica una vacante" },
  { label: "Servicios profesionales", terms: ["servicio", "profesional"], slug: "servicios", detail: "Consigue clientes" },
  { label: "Niñeras y cuidado", terms: ["ninera", "cuidado infantil"], slug: "nineras-cuidado-infantil", detail: "Presenta tu experiencia" },
  { label: "Limpieza y hogar", terms: ["limpieza", "hogar"], slug: "limpieza-del-hogar", detail: "Ofrece tus servicios" },
  { label: "Hospedajes", terms: ["hospedaje", "alquiler vacacional"], slug: "hospedajes", detail: "Promociona tu espacio" },
  { label: "Productos y otros", terms: ["otros", "producto"], slug: "otros", detail: "Anuncia lo que vendes" }
];

const demoHeroBanners = [
  {
    id: "demo-banner-playa",
    eyebrow: "Propiedades de playa",
    title: "Alquila tu apartamento de playa",
    subtitle: "Muéstralo con fotos, ubicación y contacto directo para recibir nuevas consultas.",
    cta_label: "Publicar propiedad",
    cta_url: "/publicar?categoria=bienes-raices&titulo=Apartamento%20de%20playa%20en%20alquiler&operacion=Alquiler",
    image_url: "/media/campaigns/apartamento-playa.webp",
    placement: "home",
    demo: true
  },
  {
    id: "demo-banner-local",
    eyebrow: "Locales comerciales",
    title: "Haz visible tu local comercial",
    subtitle: "Conecta tu espacio con emprendedores y empresas que buscan dónde crecer.",
    cta_label: "Anunciar mi local",
    cta_url: "/publicar?categoria=bienes-raices&titulo=Local%20comercial%20disponible&operacion=Alquiler",
    image_url: "/media/campaigns/local-comercial.webp",
    placement: "home",
    demo: true
  },
  {
    id: "demo-banner-empleo",
    eyebrow: "Talento y empleo",
    title: "Consigue el empleo que buscas",
    subtitle: "Publica gratis tu experiencia y deja que empresas y profesionales te encuentren.",
    cta_label: "Publicar mi perfil",
    cta_url: "/publicar?categoria=empleos&titulo=Busco%20oportunidad%20laboral&operacion=Servicio",
    image_url: "/media/campaigns/empleo-profesional.webp",
    placement: "home",
    demo: true
  },
  {
    id: "demo-banner-founders",
    eyebrow: "Cuentas fundadoras",
    title: "Beneficios Premium gratis hasta por 1 año",
    subtitle: "Crea tu cuenta, publica al menos 5 anuncios y participa por mayor visibilidad durante el lanzamiento.",
    cta_label: "Comenzar mis 5 anuncios",
    cta_url: "/publicar",
    image_url: "/media/campaigns/cuentas-fundadoras.webp",
    placement: "home",
    demo: true
  },
  {
    id: "demo-banner-finanzas",
    eyebrow: "Servicios profesionales",
    title: "Conecta tu asesoría con nuevos clientes",
    subtitle: "Presenta tus servicios, experiencia y datos de contacto en una publicación lista para compartir.",
    cta_label: "Anunciar mis servicios",
    cta_url: "/publicar?categoria=servicios&titulo=Asesor%C3%ADa%20profesional&operacion=Servicio",
    image_url: "/media/campaigns/asesoria-financiera.webp",
    placement: "home",
    demo: true
  }
];

const demoInlineBanners = [
  {
    id: "demo-inline-secretaria",
    eyebrow: "Secretaria ejecutiva",
    title: "¿Tienes talento para secretaria ejecutiva?",
    subtitle: "Anúnciate gratis y deja que empresas y profesionales te encuentren aquí.",
    cta_label: "Crear mi anuncio",
    cta_url: "/publicar?categoria=empleos&titulo=Secretaria%20ejecutiva&operacion=Servicio",
    image_url: "/media/campaigns/empleo-profesional.webp",
    placement: "inline",
    demo: true
  },
  {
    id: "demo-inline-hogar",
    eyebrow: "Servicios para el hogar",
    title: "¿Trabajas como empleada doméstica?",
    subtitle: "Presenta tu experiencia, disponibilidad y zona de trabajo para recibir oportunidades.",
    cta_label: "Crear mi anuncio",
    cta_url: "/publicar?categoria=limpieza-del-hogar&titulo=Empleada%20dom%C3%A9stica&operacion=Servicio",
    image_url: "/media/campaigns/cuidado-hogar.webp",
    placement: "inline",
    demo: true
  },
  {
    id: "demo-inline-cuidados",
    eyebrow: "Cuidado y acompañamiento",
    title: "Niñeras y cuidado de adultos mayores",
    subtitle: "Anuncia tu experiencia y permite que familias interesadas te contacten.",
    cta_label: "Crear mi anuncio",
    cta_url: "/publicar?categoria=nineras-cuidado-infantil&titulo=Ni%C3%B1era%20o%20cuidadora&operacion=Servicio",
    image_url: "/media/campaigns/cuidado-hogar.webp",
    placement: "inline",
    demo: true
  },
  {
    id: "demo-inline-finanzas",
    eyebrow: "Solicitud privada",
    title: "¿Necesitas un préstamo o refinanciamiento?",
    subtitle: "Cuéntanos lo que buscas y un asesor podrá revisar tu solicitud.",
    cta_label: "Solicitar orientación",
    cta_url: "/solicitar-prestamo",
    image_url: "/media/campaigns/asesoria-financiera.webp",
    placement: "inline",
    demo: true
  }
];

const demoOverflowBanners = [
  {
    id: "demo-overflow-benefits",
    eyebrow: "Ventajas PanAvisos",
    title: "Convierte tu anuncio en un enlace listo para compartir",
    cta_label: "Conocer ventajas",
    cta_url: "/#por-que-publicar",
    image_url: "/media/campaigns/local-comercial.webp",
    placement: "rail",
    demo: true
  },
  {
    id: "demo-overflow-featured",
    eyebrow: "Cuenta fundadora",
    title: "Prueba un anuncio destacado sin costo inicial",
    cta_label: "Ver beneficios",
    cta_url: "/planes",
    image_url: "/media/campaigns/cuentas-fundadoras.webp",
    placement: "rail",
    demo: true
  }
];

export function CatalogHome({ section = "home" }) {
  const [data, setData] = useState({ categories: [], listings: [], banners: [] });
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [searchArea, setSearchArea] = useState(null);
  const [searchAreaOpen, setSearchAreaOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);
  const [listingGroup, setListingGroup] = useState("");
  const sectionCopy = catalogSectionCopy(section);

  useEffect(() => {
    setListingGroup(new URLSearchParams(window.location.search).get("grupo") || "");
  }, []);

  useEffect(() => {
    let hasSavedArea = false;
    try {
      const saved = JSON.parse(window.localStorage.getItem(searchAreaCacheKey) || "null");
      if (saved?.label && saved?.province) {
        hasSavedArea = true;
        setSearchArea(saved);
      }
    } catch {
      window.localStorage.removeItem(searchAreaCacheKey);
    }

    if (hasSavedArea || !navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (permission.state === "granted") detectCurrentArea();
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    let hasSavedCatalog = false;

    try {
      const saved = JSON.parse(window.localStorage.getItem(catalogCacheKey) || "null");
      if (saved && Array.isArray(saved.categories) && Array.isArray(saved.listings) && Array.isArray(saved.banners)) {
        hasSavedCatalog = true;
        setData(saved);
        writeCachedCategories(saved.categories);
        setLoading(false);
      }
    } catch {
      window.localStorage.removeItem(catalogCacheKey);
    }

    if (!hasSavedCatalog) {
      const savedCategories = readCachedCategories();
      if (savedCategories.length) {
        setData((current) => ({ ...current, categories: savedCategories }));
      }
    }

    async function loadCatalog() {
      for (const delay of catalogRetryDelays) {
        if (delay) await wait(delay);
        if (!mounted) return;

        try {
          const response = await fetch("/api/catalog");
          if (!response.ok) throw new Error("Catalog request failed");

          const payload = await response.json();
          if (!mounted) return;

          setData((current) => {
            const nextData = {
              categories: Array.isArray(payload.categories) ? payload.categories : current.categories,
              listings: Array.isArray(payload.listings) ? payload.listings : current.listings,
              banners: Array.isArray(payload.banners) ? payload.banners : current.banners
            };
            try {
              window.localStorage.setItem(catalogCacheKey, JSON.stringify(nextData));
            } catch {
              // The live catalog remains available when browser storage is unavailable.
            }
            writeCachedCategories(nextData.categories);
            return nextData;
          });
          setCatalogError(false);
          setLoading(false);
          return;
        } catch {
          // A later attempt can recover from a cold start or a short interruption.
        }
      }

      if (!mounted) return;
      setCatalogError(!hasSavedCatalog);
      setLoading(false);
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, [catalogReloadKey]);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) return;

    const supabase = getSupabaseBrowser();

    async function loadSession() {
      await completeOAuthRedirect();
      const { data } = await supabase.auth.getSession();
      await hydrateProfile(data.session);
      if (data.session?.user && new URLSearchParams(window.location.search).has("code")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
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
      setInquiryCount(0);
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
      provider: session.user.app_metadata?.provider || "email",
      role: savedProfile?.role || savedProfile?.account_role || "Miembro PanAvisos"
    });
    await loadInquiryCount(session);
    setAccountOpen(false);
  }

  async function loadInquiryCount(session) {
    if (!session?.access_token) {
      setInquiryCount(0);
      return;
    }

    try {
      const response = await fetch("/api/account/inquiries", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const payload = await response.json().catch(() => ({}));
      setInquiryCount(
        Array.isArray(payload.inquiries)
          ? payload.inquiries.filter((inquiry) => inquiry.status === "unread").length
          : 0
      );
    } catch {
      setInquiryCount(0);
    }
  }

  async function logoutProfile() {
    await getSupabaseBrowser().auth.signOut();
    setProfile(null);
    setInquiryCount(0);
  }

  function saveSearchArea(nextArea) {
    setSearchArea(nextArea);
    setFilters((current) => ({ ...current, province: "" }));
    setLocationError("");
    if (nextArea) {
      window.localStorage.setItem(searchAreaCacheKey, JSON.stringify(nextArea));
    } else {
      window.localStorage.removeItem(searchAreaCacheKey);
    }
  }

  function clearAllFilters() {
    setFilters(emptyFilters);
    saveSearchArea(null);
  }

  function detectCurrentArea() {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no permite detectar la ubicación. Puedes elegir una zona manualmente.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = nearestKnownLocation(coords.latitude, coords.longitude);
        const nextArea = {
          key: nearest?.key || "device:current",
          label: nearest?.label || "Tu ubicación actual",
          province: nearest?.province || "Panama",
          district: nearest?.district || "",
          lat: Number(coords.latitude.toFixed(4)),
          lng: Number(coords.longitude.toFixed(4)),
          radius: Number(searchArea?.radius || 100),
          source: "device"
        };
        saveSearchArea(nextArea);
        setSearchAreaOpen(false);
        setLocating(false);
      },
      () => {
        setLocationError("No pudimos obtener tu ubicación. Elige la ciudad o provincia manualmente.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
    );
  }

  const propertyCategories = useMemo(
    () => (data.categories || []).filter(isPropertyCategory),
    [data.categories]
  );
  const marketplaceCategories = useMemo(
    () => (data.categories || []).filter((category) => !isPropertyCategory(category) && !isServiceCategory(category)),
    [data.categories]
  );
  const serviceCategories = useMemo(
    () => (data.categories || []).filter(isServiceCategory),
    [data.categories]
  );
  const demoListings = useMemo(
    () => buildDemoListings(data.categories || []),
    [data.categories]
  );
  const catalogListings = useMemo(() => {
    const realListings = data.listings || [];
    const neededSlots = Math.max(0, 12 - realListings.length);
    return [...realListings, ...demoListings.slice(0, neededSlots)];
  }, [data.listings, demoListings]);
  const scopedCategories =
    section === "properties"
      ? propertyCategories
      : section === "marketplace"
        ? listingGroup === "servicios"
          ? serviceCategories
          : marketplaceCategories
        : data.categories || [];
  const propertyListings = useMemo(
    () => catalogListings.filter(isPropertyListing),
    [catalogListings]
  );
  const marketplaceListings = useMemo(
    () => catalogListings.filter((listing) => !isPropertyListing(listing) && !isServiceCategory(listing.category)),
    [catalogListings]
  );
  const serviceListings = useMemo(
    () => catalogListings.filter((listing) => isServiceCategory(listing.category)),
    [catalogListings]
  );
  const nearbyMarketplaceListings = useMemo(
    () => marketplaceListings.filter((listing) => listingMatchesSearchArea(listing, searchArea)),
    [marketplaceListings, searchArea]
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
    const sourceListings =
      section === "properties"
        ? propertyListings
        : section === "marketplace"
          ? listingGroup === "servicios"
            ? serviceListings
            : marketplaceListings
          : catalogListings;

    return sourceListings.filter((listing) => {
      const searchText = normalize(
        `${listing.title} ${listing.description} ${listing.province} ${listing.district} ${listing.category?.name || ""}`
      );

      return (
        (!q || searchText.includes(q)) &&
        (!filters.category || listing.category_id === filters.category) &&
        (!filters.province || listing.province === filters.province) &&
        listingMatchesSearchArea(listing, searchArea) &&
        Number(listing.price) >= min &&
        Number(listing.price) <= max
      );
    });
  }, [catalogListings, filters, listingGroup, marketplaceListings, propertyListings, searchArea, section, serviceListings]);

  const featured = listings.filter((listing) => listing.featured);
  const featuredListingIds = new Set(featured.map((listing) => listing.id));
  const latestListings = listings.filter((listing) => !featuredListingIds.has(listing.id));
  const orderedListings = [...featured, ...latestListings];
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchArea ? 1 : 0);
  const sortedBanners = useMemo(
    () =>
      [...(data.banners || [])].sort(
        (a, b) =>
          new Date(b.created_at || b.starts_at || 0).getTime() -
          new Date(a.created_at || a.starts_at || 0).getTime()
      ),
    [data.banners]
  );
  const realHeroBanners = sortedBanners
    .filter((banner) => ["home", "hero", "inicio"].includes(bannerPlacement(banner)))
    .slice(0, 5);
  const heroBanners = [
    ...realHeroBanners.filter((banner) => banner.image_url),
    ...demoHeroBanners
  ].slice(0, 5);
  const feedBanners = sortedBanners.filter((banner) =>
    ["feed", "inline", "intermedio", "entre-anuncios"].includes(bannerPlacement(banner))
  );
  const inlineBanners = [
    ...feedBanners.filter((banner) => banner.image_url),
    ...demoInlineBanners
  ].slice(0, 4);
  const popupBanners = sortedBanners
    .filter((banner) => ["popup", "captacion", "lead-popup"].includes(bannerPlacement(banner)))
    .slice(0, 3);
  const realOverflowBanners = sortedBanners
    .filter((banner) => ["rail", "secondary", "secundario"].includes(bannerPlacement(banner)))
    .slice(0, 8);
  const overflowBanners = realOverflowBanners.length ? realOverflowBanners : demoOverflowBanners;
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

  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: "0px 0px 72px 0px", threshold: 0.02 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Topbar
        profile={profile}
        categories={data.categories || []}
        section={section}
        accountOpen={accountOpen}
        inquiryCount={inquiryCount}
        onOpenAccount={() => setAccountOpen((current) => !current)}
        onLogout={logoutProfile}
      />
      <main className="market-home">
        {heroBanners.length ? (
          <section className="home-band hero-banner-band" aria-label="Publicidad patrocinada">
            <div className="sponsored-heading">
              <span className="sponsored-label">Publicidad</span>
              <Link href="/publicar">Anuncia aquí</Link>
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

        {section === "home" ? <HomeQuickCategories /> : null}

        <section className="home-band universal-search-band">
          <form className="universal-search" onSubmit={submitHeroSearch}>
            <div className="universal-search-intro">
              <span className="eyebrow dark-eyebrow">{sectionCopy.eyebrow}</span>
              <h1>{sectionCopy.title}</h1>
              <p>{sectionCopy.searchHint}</p>
            </div>
            <label className="field universal-keyword">
              <span>¿Qué buscas?</span>
              <input
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                placeholder={sectionCopy.placeholder}
              />
            </label>
            <label className="field">
              <span>Categoría</span>
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
            <div className="field search-area-field">
              <span>Ubicación</span>
              <button className="search-area-button" type="button" onClick={() => setSearchAreaOpen(true)}>
                <span className="search-area-pin" aria-hidden="true">●</span>
                <span>
                  <strong>{searchArea?.label || "Elegir zona"}</strong>
                  <small>{searchArea ? `Radio de ${searchArea.radius} km` : "Todo Panamá"}</small>
                </span>
              </button>
            </div>
            <div className="universal-search-actions">
              <button className="primary" type="submit">Buscar</button>
              {activeFilterCount ? (
                <button className="universal-clear" type="button" onClick={clearAllFilters}>
                  Limpiar
                </button>
              ) : null}
            </div>
          </form>
        </section>

        {section === "home" ? (
          <div className="mobile-home-category-directory" aria-hidden="true">
            <CategoryDirectory
              title="Explora categorías"
              description="Encuentra rápidamente lo que necesitas."
              categories={scopedCategories}
              listings={catalogListings}
              categoryImages={categoryImages}
              totalCategoryImage={totalCategoryImage}
              activeCategory={filters.category}
              onSelect={applyCategory}
            />
          </div>
        ) : null}

        {section !== "home" ? (
          <CategoryDirectory
            title={sectionCopy.categoriesTitle}
            description={sectionCopy.categoriesDescription}
            categories={scopedCategories}
            listings={catalogListings}
            categoryImages={categoryImages}
            totalCategoryImage={totalCategoryImage}
            activeCategory={filters.category}
            onSelect={applyCategory}
          />
        ) : null}

        {inlineBanners.length ? <SponsoredBreak banners={inlineBanners} /> : null}

        {section === "home" ? <PublishingBenefits /> : null}

        <section className="market-layout home-band" id="anuncios">
          <aside className={`market-filters ${mobileFiltersOpen ? "open" : ""}`}>
            <div className="filter-head">
              <h2>Filtrar anuncios</h2>
              <div className="filter-head-actions">
                <button
                  className="filter-reset"
                  type="button"
                  onClick={clearAllFilters}
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
              <span>Categoría</span>
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
                onChange={(event) => {
                  saveSearchArea(null);
                  setFilters((current) => ({ ...current, province: event.target.value }));
                }}
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
                <span>Mínimo</span>
                <input
                  type="number"
                  value={filters.min}
                  onChange={(event) => setFilters({ ...filters, min: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Máximo</span>
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
                <button className="mobile-location-toggle" type="button" onClick={() => setSearchAreaOpen(true)}>
                  {searchArea ? `${searchArea.label} · ${searchArea.radius} km` : "Elegir zona"}
                </button>
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

            {catalogError ? (
              <div className="catalog-refresh-notice" role="status">
                <span>Estamos actualizando los anuncios.</span>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogError(false);
                    setLoading(true);
                    setCatalogReloadKey((current) => current + 1);
                  }}
                >
                  Reintentar
                </button>
              </div>
            ) : orderedListings.length || (!loading && listings.length === 0) ? (
              <>
                <h2 className="block-title listing-feed-title">
                  {section === "properties"
                    ? "Propiedades disponibles"
                    : section === "marketplace" && listingGroup === "servicios"
                      ? "Servicios y empleos"
                      : section === "marketplace"
                        ? "Anuncios de Marketplace"
                        : "Destacados y anuncios recientes"}
                </h2>
                {!loading && listings.length === 0 ? (
                  <div className="notice">Todavía no hay anuncios con esos filtros.</div>
                ) : (
                  <div className="grid listing-feed-grid">
                    {orderedListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} onSelect={setSelected} />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </section>
        </section>

        {section === "home" && nearbyMarketplaceListings.length ? (
          <section className="home-band marketplace-preview-band" aria-labelledby="marketplace-preview-title">
            <div className="section-head">
              <div>
                <span className="eyebrow dark-eyebrow">Marketplace</span>
                <h2 id="marketplace-preview-title">Más oportunidades cerca de ti</h2>
                <p>Vehículos, empleos, servicios y productos publicados recientemente.</p>
              </div>
              <Link className="secondary" href="/marketplace">Ver Marketplace</Link>
            </div>
            <div className="grid marketplace-preview-grid">
              {nearbyMarketplaceListings.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} onSelect={setSelected} />
              ))}
            </div>
          </section>
        ) : null}

        {section === "home" ? (
          <div className="desktop-home-category-directory">
            <CategoryDirectory
              title="Todas las categorías"
              description="Explora el directorio completo de anuncios disponibles en Panamá."
              categories={scopedCategories}
              listings={catalogListings}
              categoryImages={categoryImages}
              totalCategoryImage={totalCategoryImage}
              activeCategory={filters.category}
              onSelect={applyCategory}
              directory
            />
          </div>
        ) : null}

        {section === "home" ? <SearchRequestBand /> : null}

        {overflowBanners.length ? (
          <section className="home-band sponsored-band compact-sponsored-band" aria-labelledby="sponsored-title">
            <div className="section-head">
              <div>
                <h2 id="sponsored-title">Promociones destacadas</h2>
                <p>Oportunidades y recursos seleccionados para nuestros usuarios.</p>
              </div>
            </div>
            <div className="promo-rail">
              {overflowBanners.map((banner) => <PromoBanner key={banner.id} banner={banner} compact />)}
            </div>
          </section>
        ) : null}

        <section className="home-band feedback-band" id="contacto">
          <FeedbackForm profile={profile} />
        </section>
      </main>

      <SiteFooter />
      {!footerVisible && !selected && !accountOpen && !searchAreaOpen && !mobileFiltersOpen ? (
        <Link className="mobile-publish-fab" href="/publicar" aria-label="Publicar anuncio">
          <span aria-hidden="true">+</span>
          Publicar
        </Link>
      ) : null}
      {selected ? (
        <ListingDetail
          listing={selected}
          profile={profile}
          onClose={() => setSelected(null)}
        />
      ) : null}
      {accountOpen ? (
        <AccountModal
          onClose={() => setAccountOpen(false)}
          onLogout={logoutProfile}
          messageCount={inquiryCount}
        />
      ) : null}
      {searchAreaOpen ? (
        <SearchLocationDialog
          current={searchArea}
          locating={locating}
          error={locationError}
          onApply={(nextArea) => {
            saveSearchArea(nextArea);
            setSearchAreaOpen(false);
          }}
          onClear={() => {
            saveSearchArea(null);
            setSearchAreaOpen(false);
          }}
          onUseCurrent={detectCurrentArea}
          onClose={() => {
            setLocationError("");
            setSearchAreaOpen(false);
          }}
        />
      ) : null}
      {popupBanners.length ? <LeadPopup banners={popupBanners} /> : null}
    </>
  );
}

function SearchLocationDialog({ current, locating, error, onApply, onClear, onUseCurrent, onClose }) {
  const [selectedKey, setSelectedKey] = useState(current?.key || "");
  const [radius, setRadius] = useState(String(current?.radius || 100));

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [onClose]);

  function applyArea() {
    const selectedArea = searchAreaOptions.find((location) => location.key === selectedKey);
    if (!selectedArea) {
      onClear();
      return;
    }
    onApply({ ...selectedArea, radius: Number(radius), source: "manual" });
  }

  return (
    <div className="search-location-modal">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Cerrar" />
      <section className="search-location-dialog" role="dialog" aria-modal="true" aria-labelledby="search-location-title">
        <div className="search-location-head">
          <div>
            <span className="eyebrow dark-eyebrow">Zona de búsqueda</span>
            <h2 id="search-location-title">Buscar cerca de una ubicación</h2>
          </div>
          <button className="search-location-close" type="button" onClick={onClose} aria-label="Cerrar">X</button>
        </div>

        <button className="detect-location-button" type="button" onClick={onUseCurrent} disabled={locating}>
          <span className="search-area-pin" aria-hidden="true">●</span>
          {locating ? "Detectando ubicación..." : "Usar mi ubicación actual"}
        </button>

        <label className="field">
          <span>Ciudad, localidad o provincia</span>
          <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
            <option value="">Todo Panamá</option>
            {searchAreaOptions.map((location) => (
              <option key={location.key} value={location.key}>{location.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Radio</span>
          <select value={radius} onChange={(event) => setRadius(event.target.value)} disabled={!selectedKey}>
            <option value="10">10 kilómetros</option>
            <option value="25">25 kilómetros</option>
            <option value="50">50 kilómetros</option>
            <option value="100">100 kilómetros</option>
            <option value="200">200 kilómetros</option>
          </select>
          <small>Comenzamos con 100 km para mostrar suficientes oportunidades mientras crece el catálogo.</small>
        </label>

        {error ? <p className="error search-location-error">{error}</p> : null}

        <div className="search-location-actions">
          <button className="secondary" type="button" onClick={onClear}>Todo Panamá</button>
          <button className="primary" type="button" onClick={applyArea}>Aplicar zona</button>
        </div>
      </section>
    </div>
  );
}

function SearchRequestBand() {
  return (
    <section className="home-band search-request-band" aria-labelledby="search-request-title">
      <div className="search-request-copy">
        <span className="eyebrow dark-eyebrow">Yo busco</span>
        <h2 id="search-request-title">¿No encontraste lo que necesitas?</h2>
        <p>
          Cuéntanos qué buscas, tu zona y presupuesto. Guardamos la solicitud de forma privada para conectarte con
          opciones relevantes.
        </p>
        <div className="search-request-actions">
          <Link className="primary" href="/yo-busco">Crear solicitud gratis</Link>
          <small>No se publica en el catálogo.</small>
        </div>
      </div>
      <ol className="search-request-steps">
        <li><span>1</span><div><strong>Elige el rubro</strong><small>Propiedad, empleo, vehículo, servicio u otro.</small></div></li>
        <li><span>2</span><div><strong>Define lo importante</strong><small>Zona, presupuesto, radio y condiciones.</small></div></li>
        <li><span>3</span><div><strong>Recibe opciones</strong><small>Un asesor revisa y canaliza tu solicitud.</small></div></li>
      </ol>
    </section>
  );
}

function LeadPopup({ banners }) {
  const [open, setOpen] = useState(false);
  const banner = banners[0];

  useEffect(() => {
    if (!banner?.id) return;
    const storageKey = `panavisos-popup-${banner.id}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setOpen(true), 4500);
    return () => window.clearTimeout(timer);
  }, [banner?.id]);

  if (!open || !banner) return null;

  function close() {
    window.sessionStorage.setItem(`panavisos-popup-${banner.id}`, "seen");
    setOpen(false);
  }

  return (
    <div className="lead-popup-backdrop" role="presentation" onMouseDown={close}>
      <section className="lead-popup" role="dialog" aria-modal="true" aria-labelledby="lead-popup-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="lead-popup-close" type="button" onClick={close} aria-label="Cerrar promoción">×</button>
        {banner.image_url ? <img src={optimizeImageUrl(banner.image_url, 760)} alt="" /> : null}
        <span className="eyebrow">Oportunidad</span>
        <h2 id="lead-popup-title">{cleanBannerText(banner.title) || "¿Podemos ayudarte?"}</h2>
        {cleanBannerText(banner.subtitle) ? <p>{cleanBannerText(banner.subtitle)}</p> : null}
        {banner.cta_url ? (
          <a className="primary" href={banner.cta_url} onClick={close}>{banner.cta_label || "Completar solicitud"}</a>
        ) : null}
        <small>Puedes cerrar esta ventana y continuar navegando.</small>
      </section>
    </div>
  );
}

function PopularNeeds({ needs, categories }) {
  return (
    <section className="home-band publisher-category-band" aria-labelledby="popular-needs-title">
      <div className="publisher-category-intro">
        <div>
          <span className="eyebrow dark-eyebrow">Empieza hoy</span>
          <h2 id="popular-needs-title">¿Qué quieres anunciar?</h2>
          <p>Crea una publicación clara, agrega tus datos de contacto y compártela con tus clientes.</p>
        </div>
        <div className="publisher-category-actions">
          <Link className="primary" href="/publicar">Anunciar gratis</Link>
          <a className="secondary" href="#por-que-publicar">¿Por qué publicar?</a>
        </div>
      </div>
      <div className="publisher-category-grid">
        {needs.map((need, index) => {
          const category = findCategoryByTerms(categories, need.terms);
          const slug = category?.slug || need.slug;
          return (
            <Link
              className="publisher-category-link"
              key={need.label}
              href={`/publicar?categoria=${encodeURIComponent(slug)}`}
            >
              <span className="publisher-category-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{need.label}</strong>
                <small>{need.detail}</small>
              </span>
              <span className="publisher-category-cta">Anunciar gratis</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PublishingBenefits() {
  const benefits = [
    {
      title: "Visibilidad fundadora",
      copy: "Las primeras 100 cuentas pueden acceder a anuncios destacados de cortesía durante el lanzamiento."
    },
    {
      title: "Contacto directo",
      copy: "Muestra tu WhatsApp, sitio web y datos profesionales para facilitar nuevas consultas."
    },
    {
      title: "Enlace propio",
      copy: "Cada anuncio tiene una dirección que puedes compartir como una mini página de tu oferta."
    },
    {
      title: "Mensajes con seguimiento",
      copy: "Recibe consultas sobre tus anuncios y conserva el historial dentro de tu cuenta."
    }
  ];

  return (
    <section className="home-band publishing-benefits-band" id="por-que-publicar" aria-labelledby="publishing-benefits-title">
      <div className="publishing-benefits-intro">
        <span className="eyebrow dark-eyebrow">Ventajas para anunciantes</span>
        <h2 id="publishing-benefits-title">Publica una vez y comparte tu anuncio donde quieras</h2>
        <p>PanAvisos te ayuda a presentar mejor lo que vendes, alquilas u ofreces, incluso si todavía no tienes una página web.</p>
        <div className="publishing-benefits-actions">
          <Link className="primary" href="/publicar">Publicar mi primer anuncio</Link>
          <Link className="secondary" href="/planes">Ver beneficios fundadores</Link>
        </div>
      </div>
      <div className="publishing-benefits-list">
        {benefits.map((benefit, index) => (
          <article key={benefit.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildDemoListings(categories = []) {
  const categoryFor = (terms, fallback) => {
    const category = findCategoryByTerms(categories, terms);
    return category || { id: `demo-${fallback.slug}`, slug: fallback.slug, name: fallback.name };
  };
  const vehicles = categoryFor(["auto", "vehiculo", "carro", "moto"], { slug: "vehiculos", name: "Vehículos" });
  const jobs = categoryFor(["empleo", "vacante", "hoja"], { slug: "empleos", name: "Empleos" });
  const services = categoryFor(["servicio", "profesional"], { slug: "servicios", name: "Servicios" });
  const property = categoryFor(["bienes", "propiedad", "inmueble"], { slug: "bienes-raices", name: "Bienes raices" });

  return [
    demoListing({
      id: "demo-listing-auto",
      category: vehicles,
      title: "Espacio disponible: anuncia tu auto en venta",
      province: "Panama",
      district: "0000",
      featured: true,
      badge: "Auto disponible",
      image: "/media/campaigns/auto-clasificado.webp",
      description: "Ejemplo de espacio para vender autos, motos o repuestos. Publica fotos, precio, provincia y contacto real para recibir interesados."
    }),
    demoListing({
      id: "demo-listing-secretaria",
      category: jobs,
      title: "¿Buscas empleo de secretaria o asistente?",
      province: "Panama Oeste",
      district: "0000",
      featured: true,
      badge: "Empleo disponible",
      image: "/media/campaigns/empleo-profesional.webp",
      description: "Espacio para hojas de vida, vacantes administrativas y servicios de asistencia. Crea tu anuncio y aparece por provincia."
    }),
    demoListing({
      id: "demo-listing-ninera",
      category: services,
      title: "Niñeras y cuidado infantil: publícate aquí",
      province: "Chiriquí",
      district: "0000",
      badge: "Servicio disponible",
      image: "/media/campaigns/cuidado-hogar.webp",
      description: "Anuncia servicios de cuidado infantil, apoyo escolar o asistencia en casa. Datos de ejemplo: teléfono 0000-0000."
    }),
    demoListing({
      id: "demo-listing-finanzas",
      category: services,
      title: "Préstamos personales o asesoría financiera",
      province: "Colón",
      district: "0000",
      badge: "Cupos por provincia",
      image: "/media/campaigns/asesoria-financiera.webp",
      description: "Espacio para asesores financieros. Cupos destacados limitados a 20 asesores por provincia. Teléfono de ejemplo: 0000-0000."
    }),
    demoListing({
      id: "demo-listing-propiedad",
      category: property,
      title: "Tu propiedad puede aparecer aquí",
      province: "Panama",
      district: "0000",
      badge: "Propiedad disponible",
      image: "/media/campaigns/local-comercial.webp",
      description: "Publica casa, apartamento, terreno o local comercial con fotos, ubicación, precio y contacto directo."
    }),
    demoListing({
      id: "demo-listing-limpieza",
      category: services,
      title: "Limpieza, reparaciones o servicios del hogar",
      province: "Cocle",
      district: "0000",
      badge: "Servicio disponible",
      image: "/media/campaigns/cuidado-hogar.webp",
      description: "Ejemplo de anuncio para servicios por provincia. Publica tu oficio, horario, zona y método de contacto."
    }),
    demoListing({
      id: "demo-listing-belleza",
      category: services,
      title: "Belleza, masajes y bienestar",
      province: "Herrera",
      district: "0000",
      badge: "Anúnciate aquí",
      image: "/media/campaigns/belleza-bienestar.webp",
      description: "Espacio disponible para profesionales de belleza, masajes, uñas, barbería, estética y cuidado personal."
    }),
    demoListing({
      id: "demo-listing-hospedaje",
      category: property,
      title: "Hospedaje, cuarto o alquiler temporal",
      province: "Bocas del Toro",
      district: "0000",
      badge: "Espacio disponible",
      image: "/media/campaigns/apartamento-playa.webp",
      description: "Publica hospedajes, cuartos, alquileres temporales o espacios para turistas y visitantes."
    })
  ];
}

function demoListing({ id, category, title, province, district, description, featured = false, badge = "Espacio disponible", image = "" }) {
  return {
    id,
    slug: id,
    is_placeholder: true,
    category,
    category_id: category.id,
    title,
    operation: "Anuncio disponible",
    price: 0,
    original_price: null,
    discount_percent: null,
    province,
    district,
    address_reference: `${district}, ${province}`,
    bedrooms: 0,
    bathrooms: 0,
    area_m2: 0,
    description,
    whatsapp: null,
    email: null,
    website_url: null,
    advertiser_name: "PanAvisos",
    advertiser_phone: "0000-0000",
    advertiser_email: "anunciate@panavisos.com",
    status: "active",
    featured,
    placeholder_badge: badge,
    price_label: "Espacio disponible",
    images: image ? [{ id: `${id}-image`, url: image, position: 0 }] : []
  };
}

function HomeQuickCategories() {
  return (
    <section className="home-band home-quick-categories" aria-label="Explora categorías principales">
      <Link className="home-quick-category" href="/propiedades">
        <span className="home-quick-icon property-icon">PR</span>
        <span>
          <strong>Propiedades</strong>
          <small>Venta, alquiler y terrenos</small>
        </span>
      </Link>
      <Link className="home-quick-category" href="/marketplace?grupo=servicios">
        <span className="home-quick-icon service-icon">SV</span>
        <span>
          <strong>Servicios</strong>
          <small>Profesionales, empleos y cuidado</small>
        </span>
      </Link>
      <Link className="home-quick-category" href="/marketplace">
        <span className="home-quick-icon marketplace-icon">MP</span>
        <span>
          <strong>Marketplace</strong>
          <small>Vehículos, productos y más</small>
        </span>
      </Link>
    </section>
  );
}

function CategoryDirectory({
  title,
  description,
  categories,
  listings,
  categoryImages,
  totalCategoryImage,
  activeCategory,
  onSelect,
  directory = false
}) {
  return (
    <section className={`home-band category-band ${directory ? "category-directory-band" : ""}`}>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="category-strip">
        <button
          className={`category-tile ${!activeCategory ? "active" : ""}`}
          type="button"
          onClick={() => onSelect("")}
        >
          <span className="category-photo">
            {totalCategoryImage ? <img src={optimizeImageUrl(totalCategoryImage, 320)} alt="" loading="lazy" decoding="async" /> : <span>TO</span>}
          </span>
          <span>
            <strong>Todo</strong>
            <small>Ver anuncios</small>
          </span>
        </button>
        {categories.map((category) => {
          const look = categoryLooks[category.slug] || { icon: category.name.slice(0, 2) };
          const image = categoryImages.get(category.id);
          const listingCount = listings.filter((listing) => listing.category_id === category.id).length;
          return (
            <button
              className={`category-tile ${activeCategory === category.id ? "active" : ""}`}
              type="button"
              key={category.id}
              onClick={() => onSelect(category.id)}
            >
              <span className="category-photo">
                {image ? <img src={optimizeImageUrl(image, 240)} alt="" loading="lazy" decoding="async" /> : <span>{look.icon}</span>}
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
  );
}

function Topbar({ profile, categories = [], section, accountOpen, inquiryCount = 0, onOpenAccount, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuCategories = headerCategoryGroups
    .map((group) => {
      const category = categories.find((item) => {
        const haystack = normalize(`${item.slug} ${item.name}`);
        return group.terms.some((term) => haystack.includes(normalize(term)));
      });
      return category ? { ...group, category } : null;
    })
    .filter(Boolean);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 130);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  function openMobileMenu() {
    if (accountOpen) onOpenAccount();
    setMenuOpen(true);
  }

  return (
    <header className={`topbar marketplace-topbar ${menuOpen ? "menu-open" : ""} ${accountOpen ? "account-open" : ""} ${scrolled ? "is-scrolled" : ""}`}>
      <div className="topbar-inner">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav className="main-menu" aria-label="Categorías principales">
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
          {profile ? <Link className="desktop-top-link" href="/cuenta?tab=anuncios">Mis anuncios</Link> : <Link className="desktop-top-link" href="/cuenta">Mi cuenta</Link>}
          {profile ? <NotificationLink count={inquiryCount} /> : null}
          <AccountButton profile={profile} open={accountOpen} onOpen={onOpenAccount} />
          <Link className="primary publish-cta" href="/publicar">
            Publicar
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={openMobileMenu}
          >
            <span /><span /><span />
          </button>
        </nav>
      </div>
      <button
        className={`mobile-menu-backdrop ${menuOpen ? "open" : ""}`}
        type="button"
        aria-label="Cerrar menú"
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`mobile-nav-drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-head">
          <img src="/brand/panavisos-logo.svg" alt="PanAvisos" />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">×</button>
        </div>
        {profile ? (
          <Link className="mobile-user-summary" href="/cuenta" onClick={() => setMenuOpen(false)}>
            {profile.avatar ? (
              <img className="mobile-user-photo" src={profile.avatar} alt="" />
            ) : (
              <span className="mobile-user-avatar">{initials(profile.name || profile.email)}</span>
            )}
            <span className="mobile-user-copy">
              <strong>{profile.name || "Mi cuenta"}</strong>
              <small>{profile.email}</small>
              <em>{profile.role || "Miembro PanAvisos"}</em>
            </span>
          </Link>
        ) : (
          <button
            className="mobile-user-summary mobile-user-guest"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenAccount();
            }}
          >
            <span className="mobile-user-avatar guest">+</span>
            <span className="mobile-user-copy">
              <strong>Inicia sesión</strong>
              <small>Publica, responde y administra tus anuncios</small>
            </span>
          </button>
        )}
        <span className="mobile-menu-label">Cuenta</span>
        <nav className="mobile-account-nav" aria-label="Cuenta">
          <Link className="mobile-menu-link-with-badge" href="/cuenta?tab=mensajes" onClick={() => setMenuOpen(false)}>
            <span>Mensajes</span>
            {inquiryCount ? <span className="mobile-menu-count">{inquiryCount}</span> : null}
          </Link>
          <Link href="/cuenta?tab=anuncios" onClick={() => setMenuOpen(false)}>Mis anuncios</Link>
        </nav>
        <span className="mobile-menu-label">Explorar</span>
        <nav aria-label="Menú móvil">
          <Link href="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link href="/propiedades" onClick={() => setMenuOpen(false)}>Propiedades</Link>
          {menuCategories.filter((item) => !isPropertyCategory(item.category)).map((item) => (
            <Link
              key={item.label}
              href={`/marketplace?categoria=${item.category.slug}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/marketplace" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <a href="#anuncios" onClick={() => setMenuOpen(false)}>Anuncios</a>
          <Link href="/yo-busco" onClick={() => setMenuOpen(false)}>Yo busco</Link>
          <Link href="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
          <Link className="primary" href="/publicar" onClick={() => setMenuOpen(false)}>Publicar anuncio</Link>
        </nav>
        {!profile ? (
          <div className="mobile-auth-actions">
            <button
              className="secondary mobile-auth-action"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenAccount();
              }}
            >
              Iniciar sesión
            </button>
            <Link className="secondary mobile-auth-action register-action" href="/cuenta?mode=register" onClick={() => setMenuOpen(false)}>
              Crear cuenta
            </Link>
          </div>
        ) : (
          <>
            <Link className="secondary mobile-auth-action" href="/cuenta" onClick={() => setMenuOpen(false)}>
              Mi cuenta
            </Link>
            <button
              className="secondary mobile-auth-action"
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await onLogout?.();
              }}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </aside>
    </header>
  );
}

function NotificationLink({ count = 0 }) {
  return (
    <Link className="notification-button" href="/cuenta?tab=mensajes" aria-label={`Ver mensajes recibidos${count ? `: ${count}` : ""}`}>
      <span className="notification-bell" aria-hidden="true" />
      {count ? <span className="notification-count">{count > 99 ? "99+" : count}</span> : null}
      <span className="sr-only">Mensajes</span>
    </Link>
  );
}

function AccountButton({ profile, open, onOpen }) {
  if (profile) {
    return (
      <button
        className="profile-button"
        type="button"
        onClick={onOpen}
        aria-label={open ? "Cerrar menú de mi cuenta" : "Abrir menú de mi cuenta"}
        aria-expanded={open}
        aria-controls="account-panel"
      >
        {profile.avatar ? (
          <img className="profile-photo profile-chip-photo" src={profile.avatar} alt="" />
        ) : (
          <span className="avatar">{initials(profile.name || profile.email)}</span>
        )}
        <span className="profile-button-name">{profile.name}</span>
        <span className="account-chevron" aria-hidden="true">▾</span>
      </button>
    );
  }

  return (
    <button
      className="account-icon-button"
      type="button"
      onClick={onOpen}
      aria-label={open ? "Cerrar inicio de sesión" : "Iniciar sesión"}
      aria-expanded={open}
      aria-controls="account-panel"
    >
      <svg className="guest-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4Z" />
      </svg>
      <span className="account-icon-label">Iniciar sesión</span>
    </button>
  );
}

function AccountModal({ onClose, onLogout, messageCount = 0 }) {
  const [sessionProfile, setSessionProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingAuth, setSavingAuth] = useState(false);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

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
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (authMode === "register" && form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
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
                emailRedirectTo: getAuthRedirectOrigin(),
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

      setMessage(authMode === "register" ? "Cuenta creada. Si se requiere confirmacion, revisa tu correo antes de iniciar sesión." : "Sesión iniciada.");
      if (authMode === "login") window.location.href = "/";
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
      setError("Escribe tu correo para enviarte la recuperación.");
      return;
    }

    try {
      setSavingAuth(true);
      const { error: recoveryError } = await getSupabaseBrowser().auth.resetPasswordForEmail(form.email, {
        redirectTo: getAuthRedirectOrigin()
      });

      if (recoveryError) {
        setError(authErrorMessage(recoveryError.message));
        return;
      }

      setMessage("Te enviamos un enlace para recuperar tu contraseña.");
    } catch {
      setError("No pudimos enviar la recuperación ahora.");
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
          redirectTo: getAuthRedirectOrigin()
        }
      });

      if (googleError) {
        setError(authErrorMessage(googleError.message));
      }
    } catch {
      setError("Google todavía no está conectado en Supabase.");
    } finally {
      setSavingAuth(false);
    }
  }

  return (
    <div className={`account-modal ${sessionProfile ? "account-menu-modal" : ""}`}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Cerrar" />
      <section id="account-panel" className={`account-dialog ${sessionProfile ? "account-menu-dialog" : ""}`}>
        <button className="modal-close account-close" type="button" onClick={onClose} aria-label="Cerrar">
          X
        </button>
        {loadingAccount ? (
          <div className="account-column account-primary-panel">
            <span className="account-kicker">Cuenta PanAvisos</span>
            <h2>Cargando cuenta...</h2>
          </div>
        ) : sessionProfile ? (
          <AccountQuickPanel profile={sessionProfile} listings={myListings} messageCount={messageCount} onClose={onClose} onLogout={onLogout} />
        ) : (
          <>
            <div className="account-column account-primary-panel">
          <span className="account-kicker">Cuenta PanAvisos</span>
          <h2>{authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}</h2>
          <p className="muted account-copy">
            {authMode === "register"
              ? "Crea tu perfil con nombre, correo y contraseña para publicar o responder anuncios."
              : "Accede con Google o con tu correo y contraseña."}
          </p>
          <button className="google-button-solid active" type="button" onClick={loginWithGoogle} disabled={savingAuth}>
            Continuar con Google
          </button>
          <div className="auth-divider"><span>O usa tu correo</span></div>
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
              <span>Contraseña</span>
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
                <span>Confirmar contraseña</span>
                <input
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  placeholder="Repite tu contraseña"
                />
              </label>
            ) : null}
            <button className="primary wide-button" type="submit" disabled={savingAuth}>
              {savingAuth ? (authMode === "register" ? "Creando cuenta..." : "Iniciando...") : authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
            {authMode === "login" ? (
              <button className="text-button" type="button" onClick={sendRecoveryLink} disabled={savingAuth}>
                Olvidaste tu contraseña?
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
                  Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <span>Aún no tienes cuenta?</span>
                <button type="button" onClick={() => setAuthMode("register")}>
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        </div>
            <div className="account-column account-secondary-panel">
              <h2>Acceso rapido</h2>
              <p className="muted account-copy">Google crea la cuenta automaticamente si el correo todavía no existe.</p>
              <ul className="account-benefit-list">
                <li>Un solo acceso para publicar, responder y administrar tus anuncios.</li>
                <li>Si prefieres, también puedes usar correo y contraseña.</li>
                <li>Tus publicaciones quedan asociadas a una cuenta real.</li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function AccountQuickPanel({ profile, listings, messageCount = 0, onClose, onLogout }) {
  const activeCount = listings.filter((listing) => listing.status === "active").length;

  return (
    <>
      <div className="account-column account-primary-panel user-menu-panel">
        <div className="account-menu-head">
          <span className="account-kicker">Mi cuenta</span>
          <button className="account-close-button" type="button" onClick={onClose} aria-label="Cerrar menu">
            ×
          </button>
        </div>
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
          <span><strong>{messageCount}</strong> mensajes</span>
        </div>
        <div className="account-actions">
          <Link className="primary" href="/publicar" onClick={onClose}>
            Publicar anuncio
          </Link>
          <Link className="secondary account-menu-link-with-badge" href="/cuenta?tab=mensajes" onClick={onClose}>
            <span>Mensajes</span>
            {messageCount ? <span className="account-menu-count">{messageCount}</span> : null}
          </Link>
          <Link className="secondary" href="/cuenta?tab=anuncios" onClick={onClose}>
            Mis anuncios
          </Link>
          <Link className="secondary" href="/cuenta?tab=perfil" onClick={onClose}>
            Perfil
          </Link>
          <button
            className="secondary account-logout"
            type="button"
            onClick={async () => {
              await onLogout();
              onClose();
            }}
          >
            Cerrar sesión
          </button>
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
          <p className="muted account-copy">Todavía no tienes anuncios publicados.</p>
        )}
      </div>
    </>
  );
}

function MiniListing({ listing }) {
  const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <article className="mini-listing">
      {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">A</span>}
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
    paused: "Pausado",
    sold: "Vendido",
    rented: "Alquilado",
    archived: "Archivado",
    rejected: "Rechazado"
  };
  return labels[status] || "Pendiente";
}

function PromoBanner({ banner, large = false, compact = false }) {
  const content = banner || {
    title: "Promociona aquí",
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
      {content.image_url ? <img src={optimizeImageUrl(content.image_url, 1200)} alt="" loading="lazy" decoding="async" /> : null}
      {!artworkOnly ? <div>
        <span className="eyebrow">{content.eyebrow || "Destacado"}</span>
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

function SponsoredBreak({ banners }) {
  return (
    <section className="home-band inline-sponsored-band" aria-label="Publicidad patrocinada">
      <div className="inline-sponsored-head">
        <span>Publicidad</span>
        <Link href="/publicar">Anuncia aquí</Link>
      </div>
      <div className={`inline-sponsored-grid ${banners.length === 1 ? "single" : ""}`}>
        {banners.map((banner) => (
          <PromoBanner key={banner.id} banner={banner} compact={banners.length > 1} />
        ))}
      </div>
    </section>
  );
}

function cleanBannerText(value) {
  const text = String(value || "").trim();
  return /[A-Za-z0-9\u00c0-\u024f]/.test(text) ? text : "";
}

function authErrorMessage(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("already registered") || text.includes("already exists")) {
    return "Ese correo ya tiene cuenta. Prueba iniciar sesión.";
  }
  if (text.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (text.includes("email not confirmed")) {
    return "Falta confirmar tu correo. Revisa tu email.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "No pudimos conectar con Supabase. Revisa en Vercel que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén completas en Production, y redeploya.";
  }
  if (text.includes("password")) {
    return "Revisa la contraseña. Debe tener al menos 6 caracteres.";
  }
  return value || "No pudimos completar la acción.";
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="footer-brand">
          <img src="/brand/panavisos-logo.svg" alt="PanAvisos" />
          <p>Clasificados locales para encontrar, anunciar y conectar en Panamá.</p>
        </div>
        <nav>
          <strong>Explorar</strong>
          <Link href="/propiedades">Propiedades</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/yo-busco">Yo busco</Link>
          <a href="/#anuncios">Últimos anuncios</a>
        </nav>
        <nav>
          <strong>Tu cuenta</strong>
          <Link href="/publicar">Publicar anuncio</Link>
          <a href="/#por-que-publicar">Por qué publicar</a>
          <Link href="/planes">Planes y destacados</Link>
          <Link href="/cuenta?tab=anuncios">Mis anuncios</Link>
        </nav>
        <nav>
          <strong>Servicios expertos</strong>
          <Link href="/invertir-en-panama">Invertir en Panamá</Link>
          <Link href="/propiedades-en-panama">Propiedades en Panamá</Link>
          <Link href="/propiedades-de-playa">Propiedades de playa</Link>
          <Link href="/asesoria-migratoria-legal">Legal y migración</Link>
          <Link href="/asesoria-financiera">Asesoría financiera</Link>
          <Link href="/solicitar-prestamo">Solicitar préstamo</Link>
        </nav>
        <nav>
          <strong>Ayuda</strong>
          <Link href="/contacto">Contacto y sugerencias</Link>
          <Link href="/terminos">Términos</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <span>© 2026 PanAvisos. Todos los derechos reservados.</span>
        <span>Hecho para Panamá</span>
      </div>
    </footer>
  );
}

function ListingCard({ listing, onSelect }) {
  const images = [...(listing.images || [])].sort((a, b) => a.position - b.position);
  const image = optimizeImageUrl(images[0]?.url, 640);
  const isPlaceholder = Boolean(listing.is_placeholder);
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";
  const closed = closedStatus(listing.status);

  return (
    <article className={`card marketplace-card ${isPlaceholder ? "placeholder-card" : ""}`}>
      <button className="card-image-button" type="button" onClick={() => onSelect(listing)}>
        {image ? (
          <img className="card-image" src={image} alt={listing.title} loading="lazy" decoding="async" />
        ) : (
          <div className="card-image empty-image">{isPlaceholder ? "Disponible" : "A"}</div>
        )}
        {closed ? <span className={`small-status-ribbon ${listing.status}`}>{closed.short}</span> : null}
        {images.length > 1 ? <span className="image-count">{images.length} fotos</span> : null}
      </button>
      <div className="card-body">
        {isPlaceholder ? <span className="fresh-badge">{listing.placeholder_badge || "Espacio disponible"}</span> : null}
        {!isPlaceholder && listing.featured ? <span className="fresh-badge">Resaltado</span> : null}
        <PriceBlock listing={listing} />
        <button className="listing-title-button" type="button" onClick={() => onSelect(listing)}>
          {listing.title}
        </button>
        <span className="card-location">
          {listing.district}, {listing.province}
        </span>
        {listing.description ? (
          <span className="card-description">{listing.description}</span>
        ) : null}
        {showRealEstateFacts ? (
          <div className="facts compact-facts">
            {Number(listing.bedrooms) > 0 ? <span className="fact">{listing.bedrooms} rec.</span> : null}
            {Number(listing.bathrooms) > 0 ? <span className="fact">{listing.bathrooms} baños</span> : null}
            {Number(listing.area_m2) > 0 ? <span className="fact">{listing.area_m2} m2</span> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ListingDetail({ listing, profile, onClose }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const images = [...(listing.images || [])].sort((a, b) => a.position - b.position);
  const image = optimizeImageUrl(images[activeImage]?.url, 1200);
  const isPlaceholder = Boolean(listing.is_placeholder);
  const hasMap = listing.lat && listing.lng;
  const whatsapp = isPlaceholder ? "" : whatsappDialNumber(listing.whatsapp || listing.advertiser_phone || listing.profile?.phone || "");
  const whatsappMessage = encodeURIComponent(`Hola, vi este anuncio en PanAvisos: ${listing.title}. Sigue disponible?`);
  const showRealEstateFacts = listing.category?.slug === "bienes-raices";
  const closed = closedStatus(listing.status);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeWithKeyboard(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeWithKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [onClose]);

  function moveImage(direction) {
    if (!images.length) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  async function copyListingLink() {
    const url = isPlaceholder ? `${window.location.origin}/publicar` : `${window.location.origin}/anuncio/${listing.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareListing() {
    const url = isPlaceholder ? `${window.location.origin}/publicar` : `${window.location.origin}/anuncio/${listing.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text: `Mira este anuncio en PanAvisos: ${listing.title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch (shareError) {
      if (shareError?.name !== "AbortError") await copyListingLink();
    }
  }

  return (
    <div className="listing-modal">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Cerrar" />
      <article className="listing-dialog">
        <header className="listing-mobile-header">
          <button className="listing-back-button" type="button" onClick={onClose} aria-label="Volver al catálogo">
            <span aria-hidden="true" />
          </button>
          <strong>{listing.title}</strong>
          {!isPlaceholder ? (
            <button className="listing-header-share" type="button" onClick={shareListing}>
              {shared ? "Copiado" : "Compartir"}
            </button>
          ) : (
            <span />
          )}
        </header>
        <section className="listing-gallery">
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
            X
          </button>
          <div className="gallery-stage">
            {image ? <img src={image} alt={listing.title} decoding="async" /> : <div className="empty-image gallery-empty">A</div>}
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
                  <img src={optimizeImageUrl(item.url, 180)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="listing-info">
          <div className="listing-info-scroll">
            {closed ? (
              <div className={`closed-listing-note ${listing.status}`}>
                <strong>{closed.title}</strong>
                <span>{closed.copy}</span>
              </div>
            ) : null}
            <h2>{listing.title}</h2>
            <PriceBlock listing={listing} large />
            <p className="muted">Publicado en {listing.district}, {listing.province}</p>

            {!isPlaceholder && !closed ? <FeedbackForm profile={profile} listing={listing} compact /> : null}

            <div className="detail-actions">
              <Link className={isPlaceholder ? "primary" : "secondary"} href={isPlaceholder ? "/publicar" : `/anuncio/${listing.slug}`}>
                {isPlaceholder ? "Publicar aquí" : "Abrir anuncio"}
              </Link>
              <button className="secondary" type="button" onClick={copyListingLink}>
                {copied ? "Link copiado" : "Copiar link"}
              </button>
              {!isPlaceholder ? (
                <button className="secondary" type="button" onClick={shareListing}>
                  {shared ? "Enlace listo" : "Compartir"}
                </button>
              ) : null}
              {isPlaceholder ? (
                <p className="notice placeholder-detail-note">Este es un espacio de ejemplo. Crea tu cuenta con correo y contraseña para publicar un anuncio real.</p>
              ) : null}
              {!isPlaceholder && !closed && whatsapp ? (
                <a
                  className="primary whatsapp-contact-action"
                  href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              {!isPlaceholder && listing.website_url ? (
                <a className="secondary" href={listing.website_url} target="_blank" rel="noreferrer">
                  Sitio web
                </a>
              ) : null}
              {!isPlaceholder && listing.video_url ? (
                <a className="secondary" href={listing.video_url} target="_blank" rel="noreferrer">
                  Video
                </a>
              ) : null}
              {!isPlaceholder && listing.email ? (
                <a className="secondary" href={`mailto:${listing.email}`}>
                  Email
                </a>
              ) : null}
            </div>

            <h3>Detalles</h3>
            <dl className="detail-list">
              <div>
                <dt>Categoría</dt>
                <dd>{listing.category?.name || "Sin categoría"}</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{listing.operation}</dd>
              </div>
              {isPlaceholder ? (
                <div>
                  <dt>Contacto</dt>
                  <dd>0000-0000</dd>
                </div>
              ) : null}
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

            <h3>Descripción</h3>
            <p className="detail-description">{listing.description}</p>

            <h3>Ubicación</h3>
            <p className="muted">
              {listing.address_reference || `${listing.district}, ${listing.province}`}
            </p>
            {hasMap ? (
              <a
                className="listing-location-card"
                href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="listing-location-pin" aria-hidden="true" />
                <span>
                  <strong>Ver ubicación en el mapa</strong>
                  <small>Ubicación aproximada indicada por el anunciante</small>
                </span>
              </a>
            ) : null}

            {!isPlaceholder && listing.user_id ? (
              <div className="seller-panel compact-seller-panel">
                {listing.profile?.avatar_url ? (
                  <img className="profile-photo seller-profile-photo" src={listing.profile.avatar_url} alt="" />
                ) : (
                  <span className="avatar-badge">{initials(listing.profile?.full_name || listing.advertiser_name || "A")}</span>
                )}
                <div>
                  <h3>{listing.profile?.full_name || listing.advertiser_name || "Anunciante PanAvisos"}</h3>
                  {listing.profile?.profession ? <p className="muted">{listing.profile.profession}</p> : null}
                  {listing.profile?.bio ? <p className="seller-panel-bio">{listing.profile.bio}</p> : null}
                  <Link className="secondary compact-link" href={`/vendedor/${listing.user_id}`}>
                    Ver más anuncios
                  </Link>
                </div>
              </div>
            ) : null}

            {isPlaceholder ? (
              <Link className="primary wide-button" href="/publicar">
                Crear cuenta y publicar
              </Link>
            ) : null}
          </div>
        </aside>
      </article>
    </div>
  );
}

function FeedbackForm({ profile, listing = null, compact = false }) {
  const sellerPhone = whatsappDialNumber(listing?.whatsapp || listing?.advertiser_phone || listing?.profile?.phone || "");
  const initialMessage = listing
    ? `Me interesa el anuncio "${listing.title}" que tienes publicado en PanAvisos.`
    : "";
  const [form, setForm] = useState({
    kind: listing ? "inquiry" : "demand_suggestion",
    sender_name: profile?.name || "",
    sender_email: profile?.email || "",
    sender_phone: "",
    subject: listing ? `Mensaje sobre: ${listing.title}` : "",
    message: initialMessage,
    interest: "",
    province: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(Boolean(listing));
  const isDemandSuggestion = !listing && form.kind === "demand_suggestion";

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

    const outboundMessage = isDemandSuggestion
      ? [
          `Me gustaría encontrar o anunciar: ${form.interest.trim()}`,
          form.province ? `Región: ${form.province}` : ""
        ].filter(Boolean).join("\n")
      : form.message;

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subject: isDemandSuggestion ? `Demanda: ${form.interest.trim()}` : form.subject,
        message: outboundMessage,
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

    setStatus(
      listing
        ? "Consulta enviada. El anunciante la recibirá en PanAvisos."
        : isDemandSuggestion
          ? "Respuesta guardada. Gracias por ayudarnos a priorizar."
          : "Mensaje enviado. Gracias, lo revisaremos pronto."
    );
    setForm((current) => ({
      ...current,
      subject: listing ? current.subject : "",
      message: listing ? initialMessage : "",
      interest: listing ? current.interest : "",
      province: listing ? current.province : ""
    }));
  }

  if (listing) {
    const sellerDial = sellerPhone;
    const whatsappText = encodeURIComponent(form.message || initialMessage);
    return (
      <section className={`seller-contact-card ${compact ? "compact" : ""} ${profile ? "has-profile" : ""}`}>
        <div>
          <span className="eyebrow">Consulta directa</span>
          <h2>Enviar mensaje</h2>
          <p className="muted">Deja tus datos y el mensaje llega al anunciante. PanAvisos conserva el historial para seguimiento.</p>
        </div>
        <form onSubmit={submit}>
          <label className="field contact-identity-field">
            <span>Nombre</span>
            <input
              required
              value={form.sender_name}
              onChange={(event) => setForm({ ...form, sender_name: event.target.value })}
              placeholder="Tu nombre"
            />
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
          <div className="contact-phone-row contact-identity-field">
            <span className="country-code">+507</span>
            <label className="field">
              <span>Teléfono</span>
              <input
                type="tel"
                inputMode="tel"
                value={form.sender_phone}
                onChange={(event) => setForm({ ...form, sender_phone: event.target.value })}
                placeholder="6000-0000"
              />
            </label>
          </div>
          <p className="contact-required-note">Deja al menos un medio de contacto para que el anunciante pueda responderte.</p>
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
            {sending ? "Enviando..." : "Enviar mensaje"}
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
    <section className={`feedback-panel ${compact ? "compact" : ""} ${expanded ? "expanded" : "collapsed"}`}>
      <div>
        <span className="eyebrow">Tu opinión guía el catálogo</span>
        <h2>¿Qué te gustaría encontrar o anunciar en PanAvisos?</h2>
        <p className="muted">Cuéntanos tu región y necesidad. Usamos estas respuestas para abrir nuevas categorías y conectar mejor la oferta con la demanda.</p>
        <button className={expanded ? "secondary" : "primary"} type="button" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Cerrar" : "Compartir necesidad"}
        </button>
      </div>
      {expanded ? (
        <form className="demand-survey-form" onSubmit={submit}>
          <label className="field demand-main-field">
            <span>¿Qué te gustaría encontrar o anunciar?</span>
            <input
              required
              value={form.interest}
              onChange={(event) => setForm({ ...form, interest: event.target.value })}
              placeholder="Ej. niñera, empleo, terreno, préstamo, hospedaje..."
            />
          </label>
          <div className="field-row demand-optional-fields">
            <label className="field">
              <span>Región</span>
              <select
                required
                value={form.province}
                onChange={(event) => setForm({ ...form, province: event.target.value })}
              >
                <option value="">Selecciona tu región</option>
                <option value="Todo Panamá">Todo Panamá</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Correo opcional</span>
              <input
                type="email"
                value={form.sender_email}
                onChange={(event) => setForm({ ...form, sender_email: event.target.value })}
                placeholder="correo@email.com"
              />
              <small>Solo si quieres recibir ofertas destacadas o avisos relacionados.</small>
            </label>
          </div>
          <button className="primary" type="submit" disabled={sending}>
            {sending ? "Enviando..." : "Enviar respuesta"}
          </button>
          {status ? <p className="notice inline-auth-message">{status}</p> : null}
          {error ? <p className="error inline-auth-message">{error}</p> : null}
        </form>
      ) : null}
    </section>
  );
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function bannerPlacement(banner) {
  return normalize(banner?.placement || "home").replace(/\s+/g, "-");
}

function findCategoryByTerms(categories, terms = []) {
  return categories.find((category) => {
    const haystack = normalize(`${category.slug || ""} ${category.name || ""}`);
    return terms.some((term) => haystack.includes(normalize(term)));
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
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

function PriceBlock({ listing, large = false }) {
  if (listing.is_placeholder) {
    return (
      <div className={`price-stack ${large ? "large" : ""}`}>
        <strong className={large ? "detail-price" : "price"}>{listing.price_label || "Espacio disponible"}</strong>
      </div>
    );
  }
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
  const text = String(value || "A").trim();
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
