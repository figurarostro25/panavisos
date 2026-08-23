import "./styles.css";
import { getSiteUrl } from "@/lib/site";

import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "PanAvisos | Clasificados, empleos, vehiculos y propiedades en Panama",
  description: "Encuentra y publica propiedades, vehiculos, empleos, servicios y productos en Panama.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PanAvisos | Propiedades y clasificados de Panama",
    description: "Propiedades, vehiculos, empleos, servicios y productos publicados en Panama.",
    type: "website",
    locale: "es_PA",
    siteName: "PanAvisos",
    images: ["/brand/panavisos-logo.png"]
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
