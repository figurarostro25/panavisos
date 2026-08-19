import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TourPlannerForm } from "@/components/TourPlannerForm";

export const metadata = {
  title: "Tour inmobiliario en Panamá | Cevenpro",
  description: "Visita Panamá y conoce proyectos inmobiliarios con transporte, hospedaje y asesoría coordinada."
};

export default function TourPage() {
  return (
    <>
      <Header compact />
      <main>
        <section className="page-hero split">
          <div className="shell">
            <div>
              <span className="eyebrow gold-text">Experiencia para compradores</span>
              <h1>Visita Panamá con una agenda inmobiliaria diseñada para ti</h1>
              <p>Coordinamos llegada, hospedaje, traslados y visitas a proyectos seleccionados según presupuesto y objetivo.</p>
            </div>
            <div className="page-hero-photo" style={{ backgroundImage: "url('/images/apartamento-playa.webp')" }} />
          </div>
        </section>
        <section className="content-section wash" id="evaluacion">
          <div className="shell tour-planner-layout">
            <div className="prose tour-intro">
              <span className="eyebrow">Tour privado</span>
              <h2>Aprovecha mejor cada día en Panamá</h2>
              <p>Antes de tu llegada seleccionamos zonas y proyectos. Durante el tour cuentas con acompañamiento para comparar ubicación, precio, condiciones y potencial.</p>
              <h3>El programa puede incluir</h3>
              <ul>
                <li>Recepción y traslado desde el aeropuerto</li>
                <li>Hospedaje coordinado según tu presupuesto</li>
                <li>Visita a uno, dos o tres proyectos</li>
                <li>Transporte privado durante la agenda</li>
                <li>Reunión con asesor legal o financiero</li>
                <li>Tiempo adicional para vacaciones</li>
              </ul>
              <div className="tour-assurance">
                <strong>Una agenda enfocada en tu decisión</strong>
                <span>Primero entendemos tu propósito, luego elegimos qué propiedades vale la pena visitar.</span>
              </div>
            </div>
            <TourPlannerForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
