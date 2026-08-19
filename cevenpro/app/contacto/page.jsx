import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";

export const metadata = { title: "Contacto | Cevenpro", description: "Habla con Cevenpro sobre propiedades, inversión, venta, alquiler o servicios profesionales en Panamá." };

export default function ContactPage() {
  return (
    <>
      <Header compact />
      <main>
        <section className="page-hero"><div className="shell"><span className="eyebrow gold-text">Contacto directo</span><h1>Conversemos sobre tu propiedad o inversión</h1><p>Déjanos los datos principales. Así podremos asignar tu solicitud al asesor adecuado desde el primer contacto.</p></div></section>
        <section className="content-section wash"><div className="shell content-grid"><LeadForm title="Solicitar asesoría" source="contacto" /><aside className="info-panel"><span className="eyebrow">Cevenpro</span><h3>Central de Ventas y Proyectos</h3><p>Ciudad de Panamá</p><p>Atención con cita previa</p><p>Correo: asesoria@cevenpro.com</p><hr style={{border:0,borderTop:"1px solid var(--line)",margin:"24px 0"}} /><h3>Atendemos</h3><p>Compradores, propietarios, inversionistas, empresas, desarrolladores y visitantes extranjeros.</p></aside></div></section>
      </main>
      <Footer />
    </>
  );
}
