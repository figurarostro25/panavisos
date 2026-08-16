import Link from "next/link";
import LegalPageHeader from "@/app/legal/LegalPageHeader";

export const metadata = {
  title: "Privacidad | PanAvisos",
  description: "Politica de privacidad de PanAvisos"
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <LegalPageHeader label="Privacidad" />

      <article className="legal-card">
        <span className="eyebrow dark-eyebrow">PanAvisos informa</span>
        <h1>Politica de privacidad</h1>
        <p className="legal-updated">Ultima actualizacion: 16 de agosto de 2026</p>
        <p>
          Esta politica explica que informacion puede recibir PanAvisos, para que la utiliza y que opciones tienen las
          personas que publican anuncios, crean una cuenta o contactan a un anunciante.
        </p>

        <h2>1. Responsable y alcance</h2>
        <p>
          PanAvisos opera una plataforma de clasificados, propiedades, vehiculos, empleos, servicios y productos en
          Panama. Esta politica aplica a la navegacion del sitio, las cuentas, los anuncios, los formularios de contacto y
          las herramientas de administracion relacionadas con PanAvisos.
        </p>

        <h2>2. Informacion que podemos recibir</h2>
        <ul>
          <li>Nombre, correo, telefono, WhatsApp y otros datos que una persona decida entregar.</li>
          <li>Datos del anuncio: titulo, descripcion, precio, provincia, distrito, ubicacion aproximada, imagenes y enlaces.</li>
          <li>Mensajes, sugerencias, consultas y solicitudes de correccion o eliminacion.</li>
          <li>Datos tecnicos basicos necesarios para seguridad, funcionamiento, diagnostico y prevencion de abuso.</li>
        </ul>

        <h2>3. Para que usamos la informacion</h2>
        <p>
          Usamos la informacion para crear y mostrar anuncios, permitir el contacto solicitado por los usuarios, administrar
          cuentas, atender consultas, mantener la seguridad, detectar abuso, mejorar la experiencia y cumplir obligaciones
          legales cuando corresponda.
        </p>

        <h2>4. Que se muestra publicamente</h2>
        <p>
          El contenido de un anuncio puede ser visible para otras personas. Antes de publicar, evita incluir contrasenas,
          documentos de identidad, datos bancarios, codigos de acceso u otra informacion sensible. Los datos de contacto
          deben publicarse solo cuando el anunciante entienda que podran ser utilizados para responder al anuncio.
        </p>

        <h2>5. Proveedores y enlaces externos</h2>
        <p>
          PanAvisos puede apoyarse en proveedores de infraestructura, autenticacion, almacenamiento de imagenes y mensajeria
          para operar el servicio. Los enlaces a WhatsApp, mapas, sitios web u otros servicios tienen sus propias politicas y
          condiciones; al utilizarlos, la persona sale del control directo de PanAvisos.
        </p>

        <h2>6. Conservacion, correccion y eliminacion</h2>
        <p>
          Conservamos la informacion mientras sea necesaria para mostrar anuncios, administrar la cuenta, atender soporte,
          resolver disputas o proteger la plataforma. El anunciante puede solicitar correccion, pausa o eliminacion de un
          anuncio. Algunos registros minimos pueden conservarse por seguridad, cumplimiento o defensa de derechos.
        </p>

        <h2>7. Derechos y solicitudes</h2>
        <p>
          Puedes solicitar acceso, correccion, actualizacion, oposicion o eliminacion de tus datos cuando corresponda. Para
          iniciar una solicitud, utiliza el formulario de contacto de PanAvisos e indica claramente tu nombre, correo, la
          solicitud y el anuncio o cuenta relacionados.
        </p>

        <h2>8. Seguridad y cambios</h2>
        <p>
          Aplicamos medidas razonables de control de acceso, autenticacion y proteccion de la infraestructura. Ningun servicio
          conectado a internet puede garantizar seguridad absoluta. Esta politica puede actualizarse cuando cambien las
          funciones, proveedores o requisitos aplicables; la version vigente estara publicada en esta pagina.
        </p>

        <div className="legal-actions">
          <Link className="primary" href="/ayuda">Visitar centro de ayuda</Link>
          <Link className="secondary" href="/#contacto">Enviar una solicitud</Link>
        </div>
      </article>
    </main>
  );
}
