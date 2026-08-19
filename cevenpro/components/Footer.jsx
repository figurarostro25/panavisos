import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <img src="/brand/cevenpro-logo.svg" alt="Cevenpro" />
          <p>Central de Ventas y Proyectos. Estrategia inmobiliaria y acompañamiento integral en Panamá.</p>
        </div>
        <div>
          <h3>Propiedades</h3>
          <Link href="/propiedades?zona=Ciudad">Ciudad</Link>
          <Link href="/propiedades?zona=Playa">Playa</Link>
          <Link href="/propiedades?zona=Montaña">Montaña y fincas</Link>
          <Link href="/propiedades?tipo=Local+comercial">Locales y bodegas</Link>
        </div>
        <div>
          <h3>Servicios</h3>
          <Link href="/servicios">Vender una propiedad</Link>
          <Link href="/servicios">Asesoría financiera</Link>
          <Link href="/servicios">Legal y migración</Link>
          <Link href="/servicios">Remodelación</Link>
        </div>
        <div>
          <h3>Cevenpro</h3>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/blog">Blog inmobiliario</Link>
          <Link href="/invertir-en-panama">Invertir en Panamá</Link>
          <Link href="/tour-inmobiliario">Tour inmobiliario</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/registro-asesor">Trabaja con nosotros</Link>
          <Link href="/equipo" rel="nofollow">Acceso asesor</Link>
          <Link href="/admin" rel="nofollow">Acceso administrador</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Cevenpro. Todos los derechos reservados.</span>
        <span>Privacidad · Términos</span>
      </div>
    </footer>
  );
}
