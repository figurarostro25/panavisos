const categoryGroups = [
  {
    key: "article",
    label: "Articulo en venta",
    description: "Productos, articulos del hogar, tecnologia, moda y otros.",
    operation: "Venta",
    terms: ["marketplace", "producto", "articulo", "hogar", "mueble", "celular", "electronica", "moda", "mascota", "otros"],
    sections: [
      {
        label: "Productos",
        slugs: [
          "marketplace",
          "celulares-y-accesorios",
          "computadoras-y-tablets",
          "electronica-y-audio",
          "electronica",
          "hogar-y-muebles",
          "herramientas-y-construccion",
          "jardineria",
          "electrodomesticos",
          "moda-y-accesorios",
          "joyas-accesorios",
          "bolsos-equipaje",
          "ropa-calzado-hombre",
          "ropa-calzado-mujer",
          "juguetes-juegos",
          "bebes-y-ninos",
          "mascotas",
          "otros"
        ]
      }
    ]
  },
  {
    key: "vehicle",
    label: "Vehiculo en venta",
    description: "Autos, motos, repuestos y accesorios.",
    operation: "Venta",
    terms: ["auto", "vehiculo", "carro", "moto", "autoparte"],
    sections: [{ label: "Movilidad", slugs: ["autos", "vehiculos", "autopartes"] }]
  },
  {
    key: "property",
    label: "Vivienda en venta o alquiler",
    description: "Casas, apartamentos, terrenos, locales y oficinas.",
    operation: "Venta",
    terms: ["bienes", "propiedad", "inmueble", "terreno", "local", "vivienda"],
    sections: [{ label: "Inmuebles", slugs: ["bienes-raices", "terrenos-lotes", "locales-comerciales"] }]
  },
  {
    key: "work",
    label: "Empleos",
    description: "Vacantes y perfiles: nineras, secretarias, saloneras, azafatas y mas.",
    operation: "Servicio",
    terms: ["empleo", "vacante", "hoja", "secretaria", "salonera", "azafata", "ninera", "cuidado"],
    sections: [
      {
        label: "Trabajo y talento",
        slugs: [
          "empleos",
          "hojas-de-vida",
          "secretarias-asistentes",
          "saloneras-meseros",
          "azafatas-eventos",
          "nineras-cuidado-infantil",
          "nineras-y-cuidado",
          "cuidado-adultos-mayores",
          "limpieza-del-hogar"
        ]
      }
    ]
  },
  {
    key: "services",
    label: "Servicios",
    description: "Profesionales, belleza, masajes, tramites, comida y hospedajes.",
    operation: "Servicio",
    terms: ["servicio", "profesional", "belleza", "masaje", "asesoria", "tramite", "legal", "hospedaje", "restaurante"],
    sections: [
      {
        label: "Servicios para personas y negocios",
        slugs: [
          "servicios",
          "masajes",
          "belleza-bienestar",
          "estetica-integral",
          "salud-y-belleza",
          "prestamos-asesoria-financiera",
          "prestamos-personales",
          "tramites-financieros",
          "tramites-legales",
          "servicios-profesionales",
          "hospedajes",
          "restaurantes-comida",
          "educacion-y-cursos",
          "eventos-y-entretenimiento"
        ]
      }
    ]
  }
];

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fallbackCategoriesFor(group, categories) {
  return categories.filter((category) => {
    const haystack = normalize(`${category.slug || ""} ${category.name || ""}`);
    return group.terms.some((term) => haystack.includes(normalize(term)));
  });
}

export function getPublishCategoryGroups(categories = []) {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const used = new Set();

  return categoryGroups
    .map((group) => {
      const sections = group.sections
        .map((section) => {
          const sectionCategories = section.slugs
            .map((slug) => bySlug.get(slug))
            .filter(Boolean)
            .filter((category) => {
              if (used.has(category.id)) return false;
              used.add(category.id);
              return true;
            });
          return { ...section, categories: sectionCategories };
        })
        .filter((section) => section.categories.length);

      if (!sections.length) {
        const fallback = fallbackCategoriesFor(group, categories).filter((category) => !used.has(category.id));
        fallback.forEach((category) => used.add(category.id));
        return fallback.length ? { ...group, sections: [{ label: group.label, categories: fallback }] } : null;
      }

      return { ...group, sections };
    })
    .filter(Boolean);
}
