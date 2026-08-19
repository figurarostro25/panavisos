import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Nosotros | Cevenpro", description: "Conoce el enfoque, experiencia y dirección de Cevenpro, Central de Ventas y Proyectos." };

export default function AboutPage() {
  return (
    <>
      <Header compact />
      <main>
        <section className="page-hero split"><div className="shell"><div><span className="eyebrow gold-text">Central de Ventas y Proyectos</span><h1>Creamos mejores escenarios para vender, comprar e invertir</h1><p>Cevenpro integra estrategia comercial, tecnología y especialistas para que cada propiedad avance con orden, presentación y seguimiento.</p></div><div className="page-hero-photo founder-photo" /></div></section>
        <section className="content-section"><div className="shell content-grid"><div className="prose"><span className="eyebrow">Nuestro enfoque</span><h2>No nos limitamos a mostrar propiedades</h2><p>Estudiamos el objetivo, el público, la presentación y las condiciones de cada oportunidad. Luego construimos una ruta clara para propietarios, compradores e inversionistas.</p><h3>Enrique Martínez, cofundador</h3><p>Desde Panamá, Enrique impulsa una forma más coordinada de atender ventas, proyectos e inversión inmobiliaria, conectando especialistas cuando el proceso requiere apoyo financiero, legal, migratorio o técnico.</p><Link className="button teal" href="/contacto">Conocer al equipo</Link></div><aside className="info-panel"><span className="eyebrow">Principios</span><h3>Lo que guía cada proceso</h3><p>Información clara antes de decidir.</p><p>Estrategia adaptada a la propiedad.</p><p>Seguimiento responsable de cada prospecto.</p><p>Historial y control del proceso comercial.</p></aside></div></section>
      </main>
      <Footer />
    </>
  );
}
