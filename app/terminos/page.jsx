import Link from "next/link";
import LegalPageHeader from "@/app/legal/LegalPageHeader";

export const metadata = {
  title: "Terminos | PanAvisos",
  description: "Terminos de uso de PanAvisos"
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <LegalPageHeader label="Terminos de uso" />

      <article className="legal-card">
        <span className="eyebrow dark-eyebrow">Reglas de PanAvisos</span>
        <h1>Terminos de uso</h1>
        <p className="legal-updated">Ultima actualizacion: 16 de agosto de 2026</p>
        <p>
          Al navegar, crear una cuenta, publicar un anuncio o contactar a otra persona en PanAvisos, aceptas estos terminos.
          Si no estas de acuerdo, no utilices las funciones que requieren aceptar estas reglas.
        </p>

        <h2>1. Funcion de la plataforma</h2>
        <p>
          PanAvisos ofrece herramientas para publicar, encontrar y contactar sobre anuncios locales. Salvo que se indique lo
          contrario, PanAvisos no es propietario de los bienes, empleador, vendedor, corredor, intermediario de pagos ni parte
          del contrato que puedan celebrar los usuarios.
        </p>

        <h2>2. Responsabilidad del anunciante</h2>
        <p>
          Quien publica responde por la exactitud, legalidad, disponibilidad, precio, imagenes, permisos y condiciones de su
          anuncio. Debe mantener actualizados sus datos y retirar o corregir una publicacion que ya no sea valida.
        </p>

        <h2>3. Contenido no permitido</h2>
        <ul>
          <li>Contenido ilegal, fraudulento, falso, enganoso, acosador, discriminatorio u ofensivo.</li>
          <li>Venta u oferta de bienes, servicios o actividades prohibidas o restringidas por la ley.</li>
          <li>Suplantacion de identidad, uso de datos de terceros sin permiso o infraccion de derechos de autor y marcas.</li>
          <li>Spam, enlaces maliciosos, virus, intentos de fraude o publicaciones repetidas que afecten el servicio.</li>
          <li>Informacion sensible innecesaria, incluyendo documentos, contrasenas, claves o datos bancarios.</li>
        </ul>

        <h2>4. Moderacion y medidas</h2>
        <p>
          PanAvisos puede revisar, ocultar, pausar, editar de forma limitada para corregir formato o eliminar contenido que
          incumpla estos terminos, una solicitud valida o una obligacion legal. Tambien puede limitar cuentas, publicaciones o
          funciones cuando sea necesario para proteger a usuarios y la plataforma.
        </p>

        <h2>5. Contacto, pagos y seguridad</h2>
        <p>
          Verifica identidad, precio, propiedad, ubicacion y condiciones antes de pagar, reservar, entregar bienes o compartir
          informacion. PanAvisos no solicita que envies contrasenas ni codigos de seguridad. No entregues dinero solo por la
          existencia de un anuncio y desconfia de urgencias, precios inusuales o solicitudes fuera de contexto.
        </p>

        <h2>6. Propiedad intelectual y reclamos</h2>
        <p>
          Cada usuario debe contar con autorizacion para usar sus textos, fotografias, videos, marcas y enlaces. Si crees que
          un anuncio infringe tus derechos o contiene informacion personal publicada sin permiso, envia una solicitud detallada
          mediante el formulario de contacto para que pueda ser revisada.
        </p>

        <h2>7. Enlaces y disponibilidad</h2>
        <p>
          Los anuncios pueden incluir enlaces a servicios externos. PanAvisos no controla sus contenidos, disponibilidad,
          seguridad o condiciones. La plataforma puede actualizarse, suspenderse o cambiar funciones para mantenimiento,
          seguridad o mejora del servicio.
        </p>

        <h2>8. Cambios y contacto</h2>
        <p>
          Estos terminos pueden actualizarse cuando cambie PanAvisos o la normativa aplicable. La version vigente se publicara
          aqui. Para reportar un problema, solicitar moderacion o pedir ayuda, utiliza el centro de ayuda o el formulario de
          contacto.
        </p>

        <div className="legal-actions">
          <Link className="primary" href="/ayuda">Visitar centro de ayuda</Link>
          <Link className="secondary" href="/#contacto">Reportar un problema</Link>
        </div>
      </article>
    </main>
  );
}
