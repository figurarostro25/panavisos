import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { founderBenefits, services } from "@/data/site";
import { getPublicProperties } from "@/lib/properties";

export default async function HomePage() {
  const properties = await getPublicProperties();
  const latestProperties = properties.slice(0, 6);

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="shell hero-content">
            <span className="eyebrow">Inversión inmobiliaria en Panamá</span>
            <h1>Propiedades con estrategia. <span>Inversiones con respaldo.</span></h1>
            <p>Oportunidades seleccionadas en Panamá con respaldo comercial, financiero, legal y migratorio en cada paso de tu inversión.</p>
            <div className="hero-actions">
              <Link className="button gold" href="/propiedades">Ver propiedades</Link>
              <Link className="button light" href="/contacto?motivo=propietario">Quiero vender o alquilar</Link>
            </div>
          </div>
          <div className="hero-proof">
            <div className="shell proof-grid">
              <div><strong>360°</strong><span>Acompañamiento integral</span></div>
              <div><strong>Panamá</strong><span>Ciudad, playa y montaña</span></div>
              <div><strong>1–3</strong><span>Proyectos por tour privado</span></div>
              <div><strong>Directo</strong><span>Atención con un asesor</span></div>
            </div>
          </div>
        </section>

        <section className="search-section">
          <div className="shell">
            <div className="section-heading">
              <div><span className="eyebrow">Búsqueda personalizada</span><h2>Encuentra tu próxima oportunidad</h2></div>
              <Link className="text-link" href="/propiedades">Ver todo</Link>
            </div>
            <form className="property-search" action="/propiedades">
              <div className="search-field"><label>Operación</label><select name="operacion"><option>Comprar</option><option>Alquilar</option></select></div>
              <div className="search-field"><label>Tipo de propiedad</label><select name="tipo"><option value="">Todos los tipos</option><option>Apartamento</option><option>Casa</option><option>Local comercial</option><option>Terreno</option></select></div>
              <div className="search-field"><label>Ubicación</label><input name="ubicacion" placeholder="Ciudad, playa o montaña" /></div>
              <button className="button teal" type="submit">Buscar propiedades</button>
            </form>
          </div>
        </section>

        <section className="property-section">
          <div className="shell">
            <div className="section-heading">
              <div><span className="eyebrow">Novedades Cevenpro</span><h2>Propiedades destacadas</h2><p>Las seis publicaciones más recientes para explorar.</p></div>
              <Link className="text-link" href="/propiedades">Explorar todo</Link>
            </div>
            <div className="property-grid">
              {latestProperties.map((property) => <PropertyCard key={property.slug} property={property} />)}
            </div>
          </div>
        </section>

        <section className="owner-band">
          <div className="shell owner-grid">
            <div className="owner-photo" role="img" aria-label="Local comercial moderno" />
            <div className="owner-content">
              <span className="eyebrow">Para propietarios</span>
              <h2>Tu propiedad necesita más que una publicación.</h2>
              <p>Creamos la estrategia, presentación y escenario comercial adecuados para vender o alquilar con mayor confianza.</p>
              <div className="check-grid">
                {founderBenefits.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
              </div>
              <Link className="button gold" href="/contacto?motivo=propietario">Solicitar evaluación</Link>
            </div>
          </div>
        </section>

        <section className="service-section" id="servicios">
          <div className="shell">
            <div className="section-heading">
              <div><span className="eyebrow">Servicios expertos</span><h2>Todo el proceso, un solo equipo</h2><p>Soluciones inmobiliarias con criterio comercial y acompañamiento profesional.</p></div>
              <Link className="text-link" href="/servicios">Ver todos los servicios</Link>
            </div>
            <div className="service-list">
              {services.slice(0, 4).map((service, index) => (
                <article className="service-card" key={service.slug}>
                  <span className="number">0{index + 1}</span>
                  <h3>{service.title}</h3>
                  <p>{service.summary}</p>
                  <Link href="/servicios">Conocer más</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="invest-band">
          <div className="shell invest-grid">
            <div className="invest-photo" role="img" aria-label="Asesoría personalizada para inversionistas" />
            <div className="invest-content">
              <span className="eyebrow">Inversionistas extranjeros</span>
              <h2>Conoce Panamá antes de tomar tu decisión</h2>
              <p>Organizamos una experiencia privada para explorar proyectos, zonas y oportunidades con asesoría personalizada de principio a fin.</p>
              <div className="invest-points"><span>Recepción en aeropuerto</span><span>Hospedaje coordinado</span><span>Tour por 1 a 3 proyectos</span><span>Asesoría legal y migratoria</span></div>
              <Link className="button teal" href="/tour-inmobiliario">Diseñar mi tour inmobiliario</Link>
            </div>
          </div>
        </section>

        <section className="programs">
          <div className="shell">
            <div className="section-heading">
              <div><span className="eyebrow gold-text">Modelos modernos</span><h2>Más caminos para invertir y comprar</h2><p>Programas pensados para ampliar posibilidades sin improvisar el proceso.</p></div>
            </div>
            <div className="program-grid">
              {services.slice(4, 7).map((service, index) => (
                <article className="program-card" key={service.slug}>
                  <span className="eyebrow gold-text">Programa 0{index + 1}</span>
                  <h3>{service.title}</h3>
                  <p>{service.detail}</p>
                  <Link href="/servicios">Explorar programa</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="shell cta-inner">
            <div><h2>¿Tienes una propiedad o proyecto?</h2><p>Conversemos sobre su valor, público y estrategia comercial.</p></div>
            <Link className="button outline" href="/contacto?motivo=propietario">Hablar con Cevenpro</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
