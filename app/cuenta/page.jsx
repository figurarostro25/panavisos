import Link from "next/link";

export const metadata = {
  title: "Cuenta | PanAvisos",
  description: "Entrar o crear cuenta en PanAvisos"
};

export default function AccountPage() {
  return (
    <>
      <header className="topbar marketplace-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">PA</span>
          <span>
            <strong>PanAvisos</strong>
            <small>Cuenta</small>
          </span>
        </Link>
        <nav className="top-actions">
          <Link href="/">Catalogo</Link>
          <Link className="primary" href="/publicar">
            Publicar
          </Link>
        </nav>
      </header>

      <main className="account-page">
        <section className="account-card">
          <span className="eyebrow">Anunciantes</span>
          <h1>Entra o crea tu cuenta</h1>
          <p className="muted">
            La cuenta servira para publicar, editar tus anuncios, ver vigencias y recibir respuestas sin perder tu
            informacion.
          </p>

          <div className="login-options">
            <button className="secondary google-button" type="button">
              Continuar con Google
            </button>
            <form className="email-login">
              <label className="field">
                <span>Correo electronico</span>
                <input type="email" placeholder="tu@email.com" />
              </label>
              <button className="primary" type="button">
                Enviar enlace de acceso
              </button>
            </form>
          </div>

          <div className="notice">
            Esta pantalla queda preparada para conectar Google y correo con Supabase Auth. Mientras tanto puedes publicar y
            el admin aprueba tu anuncio.
          </div>
        </section>

        <aside className="account-side">
          <h2>Que tendra tu cuenta</h2>
          <ul>
            <li>Publicar anuncios con aprobacion.</li>
            <li>Editar datos, imagenes, precio y descuento.</li>
            <li>Ver si el anuncio esta pendiente, activo o pausado.</li>
            <li>Controlar vencimientos sin empezar desde cero.</li>
          </ul>
        </aside>
      </main>
    </>
  );
}
