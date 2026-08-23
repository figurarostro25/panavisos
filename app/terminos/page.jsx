import Link from "next/link";

export const metadata = {
  title: "Terminos | PanAvisos",
  description: "Terminos de uso de PanAvisos"
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <Link className="brand legal-brand" href="/">
        <span className="brand-mark">PA</span>
        <span>
          <strong>PanAvisos</strong>
          <small>Terminos de uso</small>
        </span>
      </Link>

      <article className="legal-card">
        <h1>Terminos de uso</h1>
        <p>
          PanAvisos es una plataforma para publicar y encontrar anuncios locales. Cada anunciante es responsable por la
          informacion, precio, imagenes, disponibilidad y condiciones de su publicacion.
        </p>

        <h2>Uso de la plataforma</h2>
        <p>
          No se permiten publicaciones falsas, contenido ilegal, ofensivo, enganoso o que infrinja derechos de terceros.
          PanAvisos puede editar, pausar o eliminar publicaciones que no cumplan estas reglas.
        </p>

        <h2>Contacto entre usuarios</h2>
        <p>
          Los interesados pueden contactar al anunciante por los medios disponibles en cada anuncio. Recomendamos verificar
          la informacion antes de realizar pagos, reservas o entregas.
        </p>

        <h2>Vigencia de anuncios y banners</h2>
        <p>
          Las publicaciones y promociones pueden tener fechas de inicio y finalizacion. Al vencer, pueden dejar de mostrarse
          automaticamente en las areas publicas del sitio.
        </p>
      </article>
    </main>
  );
}
