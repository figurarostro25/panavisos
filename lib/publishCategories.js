const categoryGroups = [
  {
    key: "properties",
    label: "Propiedades",
    description: "Casas, apartamentos, terrenos y locales.",
    sections: [{ label: "Inmuebles", slugs: ["bienes-raices"] }]
  },
  {
    key: "vehicles",
    label: "Vehiculos",
    description: "Autos, motos, repuestos y accesorios.",
    sections: [{ label: "Movilidad", slugs: ["autos"] }]
  },
  {
    key: "work",
    label: "Empleo y talento",
    description: "Vacantes, perfiles y servicios de cuidado.",
    sections: [{ label: "Trabajo", slugs: ["empleos", "hojas-de-vida", "nineras-y-cuidado", "limpieza-del-hogar"] }]
  },
  {
    key: "services",
    label: "Servicios",
    description: "Profesionales, tramites, bienestar y estadias.",
    sections: [{ label: "Servicios para ti", slugs: ["servicios", "prestamos-personales", "hospedajes", "estetica-integral", "salud-y-belleza"] }]
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "Productos, articulos y oportunidades para comprar o vender.",
    sections: [
      { label: "Tecnologia", slugs: ["celulares-y-accesorios", "computadoras-y-tablets", "electronica"] },
      { label: "Casa y jardin", slugs: ["hogar-y-muebles", "herramientas-y-construccion"] },
      { label: "Ropa y familia", slugs: ["moda-y-accesorios", "bebes-y-ninos", "mascotas"] },
      { label: "Tiempo libre", slugs: ["deportes", "eventos-y-entretenimiento"] },
      { label: "Otros", slugs: ["educacion-y-cursos", "negocios-e-industria", "gratis-y-donaciones", "marketplace"] }
    ]
  }
];

export function getPublishCategoryGroups(categories = []) {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  return categoryGroups
    .map((group) => ({
      ...group,
      sections: group.sections
        .map((section) => ({
          ...section,
          categories: section.slugs.map((slug) => bySlug.get(slug)).filter(Boolean)
        }))
        .filter((section) => section.categories.length)
    }))
    .filter((group) => group.sections.length);
}
