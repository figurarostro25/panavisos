const categoryGroups = [
  {
    key: "properties",
    label: "Propiedades",
    description: "Casas, apartamentos, terrenos y locales.",
    sections: [{ label: "Inmuebles", slugs: ["bienes-raices", "terrenos-lotes", "locales-comerciales"] }]
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
    sections: [
      {
        label: "Trabajo y cuidado",
        slugs: ["empleos", "hojas-de-vida", "nineras-cuidado-infantil", "nineras-y-cuidado", "cuidado-adultos-mayores", "limpieza-del-hogar"]
      }
    ]
  },
  {
    key: "services",
    label: "Servicios",
    description: "Profesionales, tramites, bienestar y estadias.",
    sections: [
      {
        label: "Servicios para ti",
        slugs: [
          "servicios",
          "prestamos-asesoria-financiera",
          "prestamos-personales",
          "hospedajes",
          "belleza-bienestar",
          "estetica-integral",
          "salud-y-belleza",
          "restaurantes-comida"
        ]
      }
    ]
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "Productos, articulos y oportunidades para comprar o vender.",
    sections: [
      { label: "Tecnologia", slugs: ["celulares-y-accesorios", "computadoras-y-tablets", "electronica-y-audio", "electronica"] },
      { label: "Casa y jardin", slugs: ["hogar-y-muebles", "herramientas-y-construccion", "jardineria", "electrodomesticos"] },
      { label: "Pasatiempos", slugs: ["deportes-aire-libre", "deportes", "instrumentos-musicales", "arte-manualidades", "antiguedades-coleccion", "autopartes", "bicicletas"] },
      { label: "Entretenimiento", slugs: ["libros-peliculas-musica", "videojuegos", "eventos-y-entretenimiento"] },
      { label: "Ropa y accesorios", slugs: ["moda-y-accesorios", "joyas-accesorios", "bolsos-equipaje", "ropa-calzado-hombre", "ropa-calzado-mujer"] },
      { label: "Familia", slugs: ["juguetes-juegos", "bebes-y-ninos", "mascotas"] },
      { label: "Otros", slugs: ["educacion-y-cursos", "negocios-e-industria", "gratis-y-donaciones", "venta-de-garaje", "marketplace", "otros"] }
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
