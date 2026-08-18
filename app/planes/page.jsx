import Link from "next/link";

const listingPlans = [
  {
    name: "Cuenta fundadora",
    price: "Gratis",
    period: "primeras 100 cuentas",
    badge: "Lanzamiento",
    features: [
      "Publicación inicial sin costo",
      "Destacado fundador de cortesía",
      "Mensajes recibidos en tu cuenta",
      "Prioridad para revisar sugerencias y errores"
    ]
  },
  {
    name: "Anuncio destacado",
    price: "$5",
    period: "7 días",
    badge: "Referencia",
    features: [
      "Mayor visibilidad en listados",
      "Etiqueta resaltada",
      "Ideal para vender rápido o probar demanda",
      "Sin cobro durante la fase fundadora"
    ]
  },
  {
    name: "Premium mensual",
    price: "$15",
    period: "30 días",
    badge: "Referencia",
    features: [
      "Posición preferente por categoría",
      "Mayor exposición en portada",
      "Recomendado para servicios activos",
      "Beneficio ampliado para cuentas con 5+ anuncios"
    ]
  },
  {
    name: "Banner patrocinado",
    price: "$25",
    period: "7 días",
    badge: "Referencia",
    features: [
      "Espacio tipo banner en secciones principales",
      "Enlace a tu anuncio o perfil de vendedor",
      "Útil para promociones, paquetes o negocios",
      "Activación manual durante la prueba"
    ]
  }
];

const categoryPrices = [
  ["Autos y motos", "Destacado 7 días", "$5"],
  ["Empleos y servicios", "Destacado 7 días", "$5"],
  ["Propiedades", "Destacado 15 días", "$12"],
  ["Servicios financieros", "Premium mensual", "$20"],
  ["Banners por provincia", "7 días", "$25"],
  ["Banners principales", "7 días", "$35"]
];

export const metadata = {
  title: "Planes y destacados | PanAvisos",
  description: "Planes referenciales para destacar anuncios en PanAvisos durante la fase inicial de cuentas fundadoras."
};

export default function PlanesPage() {
  return (
    <>
      <header className="topbar marketplace-topbar simple-page-topbar">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav className="top-actions">
          <Link href="/">Catálogo</Link>
          <Link className="primary" href="/publicar">Publicar gratis</Link>
        </nav>
      </header>

      <main className="pricing-page">
        <section className="pricing-hero">
          <span className="eyebrow dark-eyebrow">Cuentas fundadoras</span>
          <h1>Publica ahora y prueba anuncios destacados sin costo inicial</h1>
          <p>
            PanAvisos está en fase de lanzamiento. Las primeras cuentas que publiquen, prueben y compartan observaciones
            podrán recibir beneficios de visibilidad mientras completamos el marketplace.
          </p>
          <div className="pricing-actions">
            <Link className="primary" href="/publicar">Crear anuncio gratis</Link>
            <Link className="secondary" href="/cuenta?mode=register">Crear cuenta fundadora</Link>
          </div>
        </section>

        <section className="pricing-grid" aria-label="Planes de destacados">
          {listingPlans.map((plan) => (
            <article className="pricing-card" key={plan.name}>
              <span className="pricing-badge">{plan.badge}</span>
              <h2>{plan.name}</h2>
              <div className="pricing-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className="secondary" href="/publicar">Publicar</Link>
            </article>
          ))}
        </section>

        <section className="pricing-table-section">
          <div>
            <span className="eyebrow dark-eyebrow">Valores de referencia</span>
            <h2>Precios iniciales ilustrativos</h2>
            <p className="muted">
              Estos valores ayudan a entender el beneficio que reciben las cuentas fundadoras. Todavía no estamos cobrando
              automáticamente; los destacados de cortesía se revisan durante la fase de prueba.
            </p>
          </div>
          <div className="pricing-table">
            <div className="pricing-table-row head">
              <span>Categoría</span>
              <span>Producto</span>
              <span>Referencia</span>
            </div>
            {categoryPrices.map(([category, product, price]) => (
              <div className="pricing-table-row" key={`${category}-${product}`}>
                <span>{category}</span>
                <span>{product}</span>
                <strong>{price}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="founder-note">
          <h2>Cómo ganar más privilegios en la prueba</h2>
          <p>
            Las cuentas que publiquen anuncios reales, completen su perfil, atiendan consultas y nos reporten errores o
            mejoras podrán recibir más espacios destacados, banners de cortesía o prioridad por categoría.
          </p>
          <Link className="primary" href="/publicar">Empezar ahora</Link>
        </section>
      </main>
    </>
  );
}
