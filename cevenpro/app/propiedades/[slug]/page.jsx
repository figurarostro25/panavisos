import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { getPublicProperties, getPublicProperty } from "@/lib/properties";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const property = await getPublicProperty(slug);
  if (!property) return {};
  return { title: `${property.title} | Cevenpro`, description: property.description };
}

function buildPropertyDetails(property, properties) {
  const index = properties.findIndex((item) => item.slug === property.slug);

  return {
    code: property.code || `CEV-${String(index + 1).padStart(4, "0")}`,
    status: property.status === "published" ? "Disponible" : property.status || "Disponible",
    parking: property.parking ?? (property.beds ? 1 : 0),
    year: property.year || "Consultar",
    maintenance: property.maintenance || "Consultar",
    published: property.published || "Publicación reciente",
    amenities: property.amenities || [
      "Visita presencial o por videollamada",
      "Verificación de disponibilidad",
      "Acompañamiento durante la negociación",
      "Orientación financiera y legal"
    ]
  };
}

export default async function PropertyDetailPage({ params }) {
  const { slug } = await params;
  const [property, properties] = await Promise.all([getPublicProperty(slug), getPublicProperties()]);
  if (!property) notFound();

  const details = buildPropertyDetails(property, properties);
  const gallery = property.gallery?.length ? property.gallery : [property.image];
  const related = properties.filter((item) => item.slug !== property.slug).slice(0, 3);
  const advisorPhone = String(property.advisor?.whatsapp || property.advisor?.phone || "").replace(/\D/g, "");
  const officePhone = String(process.env.NEXT_PUBLIC_CEVENPRO_WHATSAPP || "").replace(/\D/g, "");
  const contactPhone = advisorPhone || officePhone;
  const advisorMessage = encodeURIComponent(`Hola, deseo información sobre ${property.title}.`);
  const whatsappHref = contactPhone ? `https://wa.me/${contactPhone}?text=${advisorMessage}` : "";

  return (
    <>
      <Header compact />
      <main className="property-detail-page">
        <section className="property-detail-top">
          <div className="shell">
            <nav className="breadcrumbs" aria-label="Ruta de navegación">
              <Link href="/">Inicio</Link>
              <span>/</span>
              <Link href="/propiedades">Propiedades</Link>
              <span>/</span>
              <span>{property.title}</span>
            </nav>

            <div className="property-heading">
              <div>
                <div className="property-heading-meta">
                  <span className="status-badge">{details.status}</span>
                  <span>{property.operation} · {property.type}</span>
                  <span>Código {details.code}</span>
                </div>
                <h1>{property.title}</h1>
                <p>{property.location}</p>
              </div>
              <div className="property-heading-price">
                <span>Precio</span>
                <strong>{property.priceLabel}</strong>
                <small>{details.published}</small>
              </div>
            </div>

            <div className={`property-gallery ${gallery.length > 1 ? "has-multiple" : "single"}`}>
              {gallery.slice(0, 5).map((image, index) => (
                <figure className={index === 0 ? "gallery-primary" : "gallery-secondary"} key={`${image}-${index}`}>
                  <img src={image} alt={`${property.title}, vista ${index + 1}`} />
                </figure>
              ))}
              <span className="gallery-count">{gallery.length} {gallery.length === 1 ? "foto" : "fotos"}</span>
            </div>

            <div className="property-summary" aria-label="Características principales">
              <div><span>Precio</span><strong>{property.priceLabel}</strong></div>
              <div><span>Recámaras</span><strong>{property.beds || "No aplica"}</strong></div>
              <div><span>Baños</span><strong>{property.baths || "No aplica"}</strong></div>
              <div><span>Estacionamientos</span><strong>{details.parking || "Consultar"}</strong></div>
              <div><span>Superficie</span><strong>{property.area}</strong></div>
            </div>
          </div>
        </section>

        <section className="property-detail-content">
          <div className="shell property-detail-layout">
            <div className="property-copy">
              <section className="property-copy-section">
                <span className="eyebrow">Descripción</span>
                <h2>Conoce esta propiedad</h2>
                <p className="property-description">{property.description}</p>
                <p>Solicita la disponibilidad actual, condiciones de venta o alquiler y una visita privada. Cevenpro puede acompañarte durante la comparación, negociación y revisión del proceso.</p>
              </section>

              <section className="property-copy-section">
                <h2>Características y acompañamiento</h2>
                <ul className="amenities-grid">
                  {details.amenities.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              <section className="property-copy-section">
                <h2>Ficha de la propiedad</h2>
                <dl className="property-specs">
                  <div><dt>Ubicación</dt><dd>{property.location}</dd></div>
                  <div><dt>Zona</dt><dd>{property.zone}</dd></div>
                  <div><dt>Operación</dt><dd>{property.operation}</dd></div>
                  <div><dt>Tipo</dt><dd>{property.type}</dd></div>
                  <div><dt>Superficie</dt><dd>{property.area}</dd></div>
                  <div><dt>Año</dt><dd>{details.year}</dd></div>
                  <div><dt>Mantenimiento</dt><dd>{details.maintenance}</dd></div>
                  <div><dt>Código interno</dt><dd>{details.code}</dd></div>
                </dl>
              </section>

              <section className="property-location-preview">
                <div>
                  <span className="eyebrow">Ubicación</span>
                  <h2>{property.location}</h2>
                  <p>La ubicación exacta y las indicaciones para la visita se comparten al confirmar la cita con un asesor.</p>
                </div>
                <span className="location-marker" aria-hidden="true">●</span>
              </section>
            </div>

            <aside className="property-contact" id="consulta">
              <div className="property-advisor-summary">
                <span className="eyebrow">Contacto directo</span>
                {contactPhone ? <p>WhatsApp: {contactPhone}</p> : <p>Contacto disponible en el panel de Cevenpro.</p>}
              </div>
              {whatsappHref ? <a className="button whatsapp property-advisor-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">Contactar</a> : null}
            </aside>
          </div>
        </section>

        <section className="content-section wash">
          <div className="shell">
            <div className="section-heading">
              <div><span className="eyebrow">También puedes explorar</span><h2>Propiedades similares</h2></div>
              <Link className="text-link" href="/propiedades">Ver catálogo completo</Link>
            </div>
            <div className="property-grid">{related.map((item) => <PropertyCard key={item.slug} property={item} />)}</div>
          </div>
        </section>

        <div className="mobile-property-actions">
          <a className="button outline" href="#consulta">Enviar consulta</a>
          {whatsappHref ? <a className="button whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a> : <a className="button teal" href="#consulta">Solicitar información</a>}
        </div>
      </main>
      <Footer />
    </>
  );
}
