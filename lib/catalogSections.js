const PROPERTY_TERMS = [
  "bienes raices",
  "bien raiz",
  "propiedad",
  "inmueble",
  "vivienda",
  "alquiler",
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
  const text = normalizeCatalogText(`${category?.slug || ""} ${category?.name || ""}`);
  return PROPERTY_TERMS.some((term) => text.includes(term));
}

export function isPropertyListing(listing) {
  return isPropertyCategory(listing?.category);
}

export function isServiceCategory(category) {
  const text = normalizeCatalogText(`${category?.slug || ""} ${category?.name || ""}`);
  return SERVICE_TERMS.some((term) => text.includes(term));
}

export function catalogSectionCopy(section) {
  if (section === "properties") {
    return {
      eyebrow: "Publica propiedades en Panamá",
      title: "Anuncia tu propiedad y encuentra personas interesadas",
      description: "Publica casas, apartamentos, locales comerciales y terrenos con fotos, ubicación y contacto directo.",
      searchTitle: "Buscar propiedades",
      searchHint: "Filtra por palabra, provincia o rango de precio.",
      placeholder: "Apartamento, casa, local comercial...",
      primaryCta: "Publicar propiedad",
      secondaryCta: "Explorar propiedades",
      categoriesTitle: "Tipos de propiedades",
      categoriesDescription: "Explora las publicaciones inmobiliarias disponibles.",
      resultsTitle: "Propiedades disponibles"
    };
  }

  if (section === "marketplace") {
    return {
      eyebrow: "Marketplace de Panamá",
      title: "Compra, vende y encuentra servicios cerca de ti",
      description: "Vehículos, empleos, servicios, productos y oportunidades locales en un solo lugar.",
      searchTitle: "Buscar en Marketplace",
      searchHint: "Encuentra anuncios por palabra, categoría o provincia.",
      placeholder: "Auto, empleo, servicio, producto...",
      primaryCta: "Publicar anuncio",
      secondaryCta: "Explorar Marketplace",
      categoriesTitle: "Categorías de Marketplace",
      categoriesDescription: "Atajos para productos, empleos, vehículos y servicios.",
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
