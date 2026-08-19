import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { services } from "@/data/site";

export const metadata = { title: "Servicios inmobiliarios | Cevenpro", description: "Venta, alquiler, financiamiento, asesoría legal, migración, remodelación y modelos modernos de propiedad en Panamá." };

export default function ServicesPage() {
  return (
    <>
      <Header compact />
      <main>
        <section className="page-hero split">
          <div className="shell">
            <div><span className="eyebrow gold-text">Servicios Cevenpro</span><h1>Un equipo para cada etapa de tu decisión</h1><p>Integramos estrategia comercial, propiedades, finanzas, aspectos legales, migración y ejecución para reducir fricción y ahorrar tiempo.</p></div>
            <div className="page-hero-photo" style={{ backgroundImage: "url('/images/local-comercial.webp')" }} />
          </div>
        </section>
        <section className="content-section">
          <div className="shell">
            <div className="section-heading"><div><span className="eyebrow">Soluciones integrales</span><h2>Servicios preparados para avanzar</h2><p>Puedes contratar un servicio puntual o construir una ruta completa.</p></div></div>
            <div className="service-list">
              {services.map((service, index) => <article className="service-card service-card-featured" key={service.slug}>
                <div className="service-card-media"><img src={service.image} alt="" /></div>
                <div className="service-card-body"><span className="number">{String(index + 1).padStart(2, "0")}</span><h3>{service.title}</h3><p>{service.summary}</p><Link href={`/contacto?servicio=${service.slug}`}>Solicitar información</Link></div>
              </article>)}
            </div>
          </div>
        </section>
        <section className="content-section wash"><div className="shell content-grid"><div className="prose"><span className="eyebrow">Nuestra forma de trabajar</span><h2>Primero entendemos el objetivo</h2><p>No todas las propiedades ni todos los compradores necesitan el mismo proceso. Ordenamos la información, definimos prioridades y asignamos a las personas correctas.</p><h3>Etapas</h3><ul><li>Diagnóstico y objetivo</li><li>Ruta comercial o de inversión</li><li>Documentación y preparación</li><li>Presentación, negociación y seguimiento</li><li>Cierre y servicios posteriores</li></ul></div><LeadForm compact title="Solicitar evaluación" source="servicios" /></div></section>
      </main>
      <Footer />
    </>
  );
}
