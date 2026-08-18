import Link from "next/link";

export const metadata = {
  title: "Privacidad | PanAvisos",
  description: "Politica de privacidad de PanAvisos"
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="brand legal-brand" href="/">
        <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
      </Link>

      <article className="legal-card">
        <h1>Politica de privacidad</h1>
        <p>
          PanAvisos usa la informacion enviada por anunciantes para crear, mostrar, administrar y mejorar las
          publicaciones dentro de la plataforma.
        </p>

        <h2>Datos que podemos recibir</h2>
        <p>
          Podemos recibir nombre del anunciante, teléfono, WhatsApp, correo, ubicación aproximada, sitio web, imágenes y
          detalles del anuncio.
        </p>

        <h2>Uso de la informacion</h2>
        <p>
          La informacion se usa para mostrar anuncios, facilitar contacto entre interesados y anunciantes, revisar calidad
          del contenido y prevenir abuso.
        </p>

        <h2>Control de publicaciones</h2>
        <p>
          Los anunciantes pueden solicitar ajustes o eliminacion de contenido. PanAvisos puede conservar registros
          necesarios para seguridad, soporte o cumplimiento operativo.
        </p>
      </article>
    </main>
  );
}
