import "./styles.css";
import { getSiteUrl } from "@/lib/site";

import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "PanAvisos | Clasificados, empleos, vehículos y propiedades en Panamá",
  description: "Encuentra y publica propiedades, vehículos, empleos, servicios y productos en Panamá.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PanAvisos | Propiedades y clasificados de Panamá",
    description: "Propiedades, vehículos, empleos, servicios y productos publicados en Panamá.",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
