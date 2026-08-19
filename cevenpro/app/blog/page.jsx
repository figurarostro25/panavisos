import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { articles } from "@/data/site";

export const metadata = { title: "Blog inmobiliario | Cevenpro", description: "Guías para comprar, vender, alquilar e invertir en propiedades en Panamá." };

export default function BlogPage() {
  return <><Header compact /><main><section className="page-hero"><div className="shell"><span className="eyebrow gold-text">Conocimiento inmobiliario</span><h1>Guías para decidir con mayor claridad</h1><p>Contenido sobre propiedades, inversión, venta, alquiler y procesos relacionados en Panamá.</p></div></section><section className="content-section wash"><div className="shell article-grid">{articles.map((article) => <article className="article-card" key={article.slug}><Link className="article-media" href={`/blog/${article.slug}`}><img src={article.image} alt={article.title} /></Link><div><span className="eyebrow">{article.category} · {article.readTime}</span><h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link className="text-link" href={`/blog/${article.slug}`}>Leer artículo</Link></div></article>)}</div></section></main><Footer /></>;
}
