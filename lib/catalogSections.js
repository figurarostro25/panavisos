const PROPERTY_TERMS = [
  "bienes raices",
  "bien raiz",
  "propiedad",
  "inmueble",
  "vivienda",
  "alquiler",
  "venta de casas"
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

export function catalogSectionCopy(section) {
  if (section === "properties") {
    return {
      eyebrow: "Propiedades en Panama",
      title: "Encuentra propiedades, locales y terrenos",
      description: "Busca casas, apartamentos, locales comerciales y lotes por provincia y zona.",
      searchTitle: "Buscar propiedades",
      searchHint: "Filtra por palabra, provincia o rango de precio.",
      placeholder: "Apartamento, casa, local comercial...",
      categoriesTitle: "Tipos de propiedades",
      categoriesDescription: "Explora las publicaciones inmobiliarias disponibles.",
      resultsTitle: "Propiedades disponibles"
    };
  }

  if (section === "marketplace") {
    return {
      eyebrow: "Marketplace de Panama",
      title: "Compra, vende y encuentra servicios cerca de ti",
      description: "Vehiculos, empleos, servicios, productos y oportunidades locales en un solo lugar.",
      searchTitle: "Buscar en Marketplace",
      searchHint: "Encuentra anuncios por palabra, categoria o provincia.",
      placeholder: "Auto, empleo, servicio, producto...",
      categoriesTitle: "Categorias de Marketplace",
      categoriesDescription: "Atajos para productos, empleos, vehiculos y servicios.",
      resultsTitle: "Anuncios de Marketplace"
    };
  }

  return {
    eyebrow: "Propiedades y clasificados de Panama",
    title: "Encuentra propiedades y oportunidades en Panama",
    description: "Comienza por propiedades y descubre tambien vehiculos, empleos, servicios y productos locales.",
    searchTitle: "Que estas buscando",
    searchHint: "Busca por palabra, categoria o provincia.",
    placeholder: "Apartamento, local comercial, auto, empleo...",
    categoriesTitle: "Explora por categoria",
    categoriesDescription: "Propiedades primero, con acceso directo al Marketplace.",
    resultsTitle: "Propiedades recientes"
  };
}
