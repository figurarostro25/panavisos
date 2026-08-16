import Link from "next/link";
import LegalPageHeader from "@/app/legal/LegalPageHeader";

export const metadata = {
  title: "Centro de ayuda | PanAvisos",
  description: "Respuestas para publicar, buscar y usar PanAvisos"
};

const helpGroups = [
  {
    title: "Publicar y administrar anuncios",
    items: [
      {
        question: "Como publico un anuncio?",
        answer: "Entra en Publicar anuncio, completa categoria, titulo, precio, ubicacion, descripcion y contacto. Revisa la vista previa antes de enviar y agrega solo imagenes que tengas derecho a utilizar."
      },
      {
        question: "Puedo corregir o eliminar mi anuncio?",
        answer: "Si tienes cuenta, entra en Mi cuenta para revisar tus anuncios. Si necesitas ayuda con una publicacion, envia el enlace o titulo desde el formulario de contacto."
      },
      {
        question: "Cuanto tiempo permanece un anuncio?",
        answer: "Los anuncios pueden tener una fecha de vencimiento. Cuando dejan de estar vigentes pueden ocultarse de las areas publicas; mantenlos actualizados y solicita su eliminacion cuando ya no correspondan."
      }
    ]
  },
  {
    title: "Buscar y contactar",
    items: [
      {
        question: "Como encuentro algo especifico?",
        answer: "Usa la busqueda por palabra, categoria o provincia. En cada anuncio revisa precio, ubicacion, descripcion y fecha antes de contactar."
      },
      {
        question: "Como contacto al anunciante?",
        answer: "Abre el anuncio y usa los medios que el anunciante haya decidido mostrar, como WhatsApp, correo o sitio web. No compartas contrasenas ni codigos de acceso."
      },
      {
        question: "Que hago si un anuncio parece fraudulento?",
        answer: "No envies dinero ni documentos. Guarda el enlace, explica el motivo y reportalo desde el formulario de contacto para que podamos revisarlo."
      }
    ]
  },
  {
    title: "Cuenta, privacidad y reglas",
    items: [
      {
        question: "Necesito una cuenta para buscar?",
        answer: "Puedes explorar los anuncios publicos sin cuenta. Algunas acciones, como publicar o administrar tus anuncios, requieren iniciar sesion."
      },
      {
        question: "Como solicito corregir o borrar mis datos?",
        answer: "Envia una solicitud desde Contacto y sugerencias indicando el correo de la cuenta, el anuncio relacionado y la accion que necesitas. Revisaremos la solicitud y podremos pedir datos para verificarla."
      },
      {
        question: "Que contenido no se permite?",
        answer: "No se permiten anuncios falsos, ilegales, discriminatorios, enganosos, con spam, suplantacion, datos de terceros sin permiso o productos y servicios restringidos. Consulta los Terminos para ver las reglas completas."
      }
    ]
  }
];

export default function HelpPage() {
  return (
    <main className="legal-page help-page">
      <LegalPageHeader label="Centro de ayuda" />

      <section className="help-intro legal-card">
        <span className="eyebrow dark-eyebrow">Estamos para ayudarte</span>
        <h1>Centro de ayuda</h1>
        <p>
          Respuestas sencillas para publicar, buscar, contactar y mantener segura tu experiencia en PanAvisos.
        </p>
        <div className="legal-actions">
          <Link className="primary" href="/publicar">Publicar anuncio</Link>
          <Link className="secondary" href="/#contacto">Contactar a PanAvisos</Link>
        </div>
      </section>

      <div className="help-groups">
        {helpGroups.map((group) => (
          <section className="help-group legal-card" key={group.title}>
            <h2>{group.title}</h2>
            <div className="help-faq-list">
              {group.items.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="help-footer-note legal-card">
        <h2>Tambien puedes consultar</h2>
        <div className="help-link-row">
          <Link href="/terminos">Terminos de uso</Link>
          <Link href="/privacidad">Politica de privacidad</Link>
          <Link href="/#contacto">Contacto y sugerencias</Link>
        </div>
      </section>
    </main>
  );
}
