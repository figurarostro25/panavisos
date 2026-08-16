import Link from "next/link";

export default function LegalPageHeader({ label }) {
  return (
    <header className="legal-header">
      <div className="legal-header-row">
        <Link className="brand legal-brand" href="/">
          <span className="brand-mark">PA</span>
          <span>
            <strong>PanAvisos</strong>
            <small>{label}</small>
          </span>
        </Link>
        <Link className="legal-close" href="/" aria-label="Cerrar y volver al inicio">
          ×
        </Link>
      </div>
      <nav className="legal-nav" aria-label="Navegacion informativa">
        <Link href="/">Inicio</Link>
        <Link href="/ayuda">Centro de ayuda</Link>
        <Link href="/terminos">Terminos</Link>
        <Link href="/privacidad">Privacidad</Link>
      </nav>
    </header>
  );
}
