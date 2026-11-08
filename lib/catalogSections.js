const PROPERTY_CATEGORY_SLUGS = new Set([
  "bienes-raices",
  "propiedades",
  "terrenos-lotes",
  "locales-comerciales"
]);

const SERVICE_CATEGORY_SLUGS = new Set([
  "servicios",
  "empleos",
  "nineras-cuidado-infantil",
  "limpieza-del-hogar",
  "prestamos-asesoria-financiera",
  "hospedajes",
  "restaurantes-comida",
  "belleza-bienestar",
  "secretarias-asistentes",
  "saloneras-meseros",
  "azafatas-eventos",
  "cuidado-adultos-mayores",
  "masajes"
]);

const PROPERTY_TERMS = [
  "bienes raices",
  "bien raiz",
  "propiedad",
  "inmueble",
  "vivienda",
  "venta de casas"
];

const SERVICE_TERMS = [
  "servicio",
  "profesional",
  "empleo",
  "trabajo",
  "vacante",
  "ninera",
  "cuidado",
  "limpieza",
  "masaje",
  "salonera",
  "mesera",
  "azafata",
  "secretaria",
  "asistente",
  "belleza",
  "estetica",
  "legal",
  "financiero",
  "financiera",
  "prestamo",
  "asesoria",
  "hospedaje",
  "restaurante",
  "comida",
  "tramite"
];

export function normalizeCatalogText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isPropertyCategory(category) {
  const slug = String(category?.slug || "").toLowerCase();
  if (PROPERTY_CATEGORY_SLUGS.has(slug)) return true;
  if (SERVICE_CATEGORY_SLUGS.has(slug)) return false;

  const text = normalizeCatalogText(`${category?.slug || ""} ${category?.name || ""}`);
  if (PROPERTY_TERMS.some((term) => text.includes(term))) return true;

  const propertyContext = ["casa", "apartamento", "terreno", "lote", "finca", "local", "oficina", "bodega"];
  return text.includes("alquiler") && propertyContext.some((term) => text.includes(term));
}

export function isPropertyListing(listing) {
  return isPropertyCategory(listing?.category);
}

export function isServiceCategory(category) {
  const slug = String(category?.slug || "").toLowerCase();
  if (SERVICE_CATEGORY_SLUGS.has(slug)) return true;
  if (PROPERTY_CATEGORY_SLUGS.has(slug)) return false;

  const text = normalizeCatalogText(`${category?.slug || ""} ${category?.name || ""}`);
  return SERVICE_TERMS.some((term) => text.includes(term));
}

export function catalogSectionCopy(section) {
  if (section === "properties") {
    return {
      eyebrow: "Publica propiedades en Panamá",
      title: "Encuentra propiedades o publica lo que estás buscando",
      description: "Explora propiedades en venta y alquiler, o publica tu búsqueda de casa, apartamento, local o terreno.",
      searchTitle: "Buscar propiedades",
      searchHint: "Filtra por palabra, provincia o rango de precio.",
      placeholder: "Apartamento, casa, local comercial...",
      primaryCta: "Publicar propiedad",
      secondaryCta: "Explorar propiedades",
      categoriesTitle: "Tipos de propiedades",
      categoriesDescription: "Explora propiedades ofrecidas y búsquedas inmobiliarias de personas en Panamá.",
      resultsTitle: "Propiedades y búsquedas recientes"
    };
  }

  if (section === "marketplace") {
    return {
      eyebrow: "Marketplace de Panamá",
      title: "Compra, vende y descubre ofertas cerca de ti",
      description: "Vehículos, productos y ofertas locales en un solo lugar.",
      searchTitle: "Buscar en Marketplace",
      searchHint: "Encuentra anuncios por palabra, categoría o provincia.",
      placeholder: "Auto, producto, repuesto, oferta...",
      primaryCta: "Publicar anuncio",
      secondaryCta: "Explorar Marketplace",
      categoriesTitle: "Categorías de Marketplace",
      categoriesDescription: "Explora autos, productos y otras ofertas disponibles.",
      resultsTitle: "Anuncios de Marketplace"
    };
  }

  return {
    eyebrow: "Propiedades y clasificados de Panamá",
    title: "Encuentra y anuncia en Panamá",
    description: "Propiedades, vehículos, empleos y servicios cerca de ti.",
    searchTitle: "Buscar anuncios",
    searchHint: "Busca por palabra, categoría o provincia.",
    placeholder: "Apartamento, local comercial, auto, empleo...",
    primaryCta: "Publicar anuncio",
    secondaryCta: "Explorar anuncios",
    categoriesTitle: "Explora por categoría",
    categoriesDescription: "Propiedades primero, con acceso directo al Marketplace.",
    resultsTitle: "Propiedades recientes"
  };
}
