import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { articles } from "@/data/site";

export function generateStaticParams() { return articles.map((article) => ({ slug: article.slug })); }

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return article ? { title: `${article.title} | Cevenpro`, description: article.excerpt } : {};
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  return <><Header compact /><main><section className="article-hero"><div className="shell"><span className="eyebrow gold-text">{article.category} · {article.readTime}</span><h1>{article.title}</h1><p>{article.excerpt}</p></div></section><section className="content-section"><div className="shell content-grid"><article className="prose article-body"><img src={article.image} alt={article.title} /><h2>Primero define el objetivo</h2><p>Una buena decisión inmobiliaria comienza por ordenar presupuesto, plazo, ubicación, uso esperado y condiciones no negociables. Esa información permite comparar alternativas reales y evitar visitas o trámites que no aportan valor.</p><h3>Revisa información y documentos</h3><p>Antes de reservar o firmar, confirma titularidad, condiciones, costos recurrentes y cualquier obligación relacionada con la propiedad. Cuando corresponda, trabaja con profesionales autorizados.</p><h3>Compara el escenario completo</h3><p>El precio es solo una parte. Ubicación, mantenimiento, demanda, liquidez, financiamiento y potencial de renta pueden cambiar el resultado de una compra o venta.</p><p>Cevenpro puede ayudarte a organizar esta evaluación y coordinar las especialidades necesarias.</p><Link className="button outline" href="/blog">Volver al blog</Link></article><LeadForm compact title="Solicitar orientación" source={`blog-${article.slug}`} /></div></section></main><Footer /></>;
}
