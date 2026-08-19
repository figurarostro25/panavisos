import Link from "next/link";
import { navigation } from "@/data/site";

export function Header({ compact = false }) {
  return (
    <>
      <div className="brand-line" />
      <header className={`site-header ${compact ? "compact" : ""}`}>
        <div className="shell header-inner">
          <Link className="site-brand" href="/" aria-label="Cevenpro Central de Ventas y Proyectos, inicio">
            <img src="/brand/cevenpro-logo.svg" alt="Cevenpro Central de Ventas y Proyectos" />
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            {navigation.map((item) => (
              <Link className={item.href === "/propiedades" ? "catalog-nav-link" : ""} href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
          <Link className="button gold small header-action" href="/contacto?motivo=propietario">Confíanos tu propiedad</Link>
          <details className="mobile-menu">
            <summary aria-label="Abrir menú"><span /><span /><span /></summary>
            <nav>
              {navigation.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
              <Link href="/contacto?motivo=propietario">Confíanos tu propiedad</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
