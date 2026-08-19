import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LeadForm } from "@/components/LeadForm";
import { PropertyCard } from "@/components/PropertyCard";
import { getPublicAdvisor } from "@/lib/advisors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const advisor = await getPublicAdvisor(slug);
  if (!advisor) return {};
  return {
    title: `${advisor.name} | Asesor Cevenpro`,
    description: `Propiedades y contacto directo con ${advisor.name}, asesor asociado a Cevenpro.`
  };
}

export default async function AdvisorProfilePage({ params }) {
  const { slug } = await params;
  const advisor = await getPublicAdvisor(slug);
  if (!advisor) notFound();
  const phone = String(advisor.whatsapp || advisor.phone || "").replace(/\D/g, "");
  const whatsappHref = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${advisor.name}, vi tu perfil en Cevenpro y quisiera consultarte sobre una propiedad.`)}` : "";

  return <><Header compact /><main className="advisor-profile-page"><section className="advisor-profile-hero"><div className="shell advisor-profile-hero-grid"><div><span className="eyebrow">Asesor asociado Cevenpro</span><h1>{advisor.name}</h1><p>{advisor.bio || "Atención personalizada para vender, alquilar y encontrar propiedades en Panamá."}</p><div className="advisor-profile-actions">{whatsappHref ? <a className="button whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a> : null}{advisor.website ? <a className="button outline" href={advisor.website} target="_blank" rel="noreferrer">Sitio web</a> : null}</div></div><aside><span>{advisor.properties.length}</span><strong>{advisor.properties.length === 1 ? "propiedad publicada" : "propiedades publicadas"}</strong><Link href="/">Conocer Cevenpro</Link></aside></div></section><section className="content-section advisor-profile-content"><div className="shell advisor-profile-grid"><div><div className="section-heading"><div><span className="eyebrow">Catálogo personal</span><h2>Propiedades de {advisor.name}</h2></div></div>{advisor.properties.length ? <div className="property-grid">{advisor.properties.map((property) => <PropertyCard key={property.slug} property={property} />)}</div> : <div className="advisor-profile-empty"><h2>Próximamente habrá propiedades publicadas</h2><p>Este perfil se actualizará a medida que se incorporen nuevas oportunidades.</p></div>}</div><aside className="advisor-profile-contact" id="contacto"><LeadForm compact title={`Escribir a ${advisor.name}`} source={`asesor:${advisor.profile_slug}`} /></aside></div></section></main><Footer /></>;
}
