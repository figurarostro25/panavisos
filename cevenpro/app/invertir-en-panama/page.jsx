import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";

export const metadata = { title: "Invertir en Panamá | Cevenpro", description: "Propiedades, residencia por inversión, financiamiento y acompañamiento para inversionistas extranjeros en Panamá." };

export default function InvestPage() {
  return (
    <>
      <Header compact />
      <main>
        <section className="page-hero split"><div className="shell"><div><span className="eyebrow gold-text">Inversión internacional</span><h1>Invierte en Panamá con una visión completa</h1><p>Comparamos oportunidades, estructura de compra, potencial de renta, financiamiento y opciones migratorias antes de que tomes una decisión.</p><div className="hero-actions"><Link className="button gold" href="#evaluacion">Solicitar evaluación privada</Link><Link className="button light" href="/propiedades">Ver propiedades</Link></div></div><div className="page-hero-photo" style={{ backgroundImage: "url('/images/asesoria-financiera.webp')" }} /></div></section>
        <section className="content-section"><div className="shell content-grid"><div className="prose"><span className="eyebrow">Panamá como plataforma</span><h2>Conectividad, moneda estable y oportunidades diversas</h2><p>Panamá combina actividad logística, servicios, turismo, banca, conectividad aérea y una oferta inmobiliaria que va desde ciudad hasta playa y montaña.</p><h3>Lo que revisamos contigo</h3><ul><li>Objetivo de inversión y horizonte</li><li>Ubicación, demanda y potencial de renta</li><li>Costos de operación y mantenimiento</li><li>Estructura legal y debida diligencia</li><li>Financiamiento y residencia por inversión</li></ul><p>Cada caso debe validarse con profesionales autorizados. Cevenpro coordina el proceso y conecta las especialidades necesarias.</p></div><div id="evaluacion"><LeadForm title="Evaluación para inversionistas" source="inversion-panama" /></div></div></section>
        <section className="programs"><div className="shell"><div className="section-heading"><div><span className="eyebrow gold-text">Acompañamiento</span><h2>Una ruta diseñada alrededor de tu objetivo</h2></div></div><div className="program-grid"><article className="program-card"><span className="eyebrow gold-text">01</span><h3>Exploración</h3><p>Entendemos presupuesto, país, calendario y propósito.</p></article><article className="program-card"><span className="eyebrow gold-text">02</span><h3>Selección</h3><p>Preparamos propiedades y proyectos comparables.</p></article><article className="program-card"><span className="eyebrow gold-text">03</span><h3>Decisión</h3><p>Coordinamos visitas, análisis, documentos y cierre.</p></article></div></div></section>
      </main>
      <Footer />
    </>
  );
}
