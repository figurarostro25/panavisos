import "./styles.css";
import { getSiteUrl } from "@/lib/site";
import SeasonalDecor from "./SeasonalDecor";
import "./seasonal.css";
import "./contact-links.css";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "PanAvisos | Clasificados, empleos, vehículos y propiedades en Panamá",
  description: "Encuentra propiedades, vehículos, empleos, servicios y productos en Panamá. Publica gratis tu anuncio o lo que estás buscando.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PanAvisos | Propiedades y clasificados de Panamá",
    description: "Propiedades, vehículos, empleos, servicios y productos en Panamá, además de búsquedas publicadas por la comunidad.",
    type: "website",
    locale: "es_PA",
    siteName: "PanAvisos",
    images: ["/brand/panavisos-logo.svg"]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SeasonalDecor />
        {children}
      </body>
    </html>
  );
}
