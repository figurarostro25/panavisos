import "./globals.css";
import { PwaRegistration } from "@/components/PwaRegistration";
import { WhatsAppChat } from "@/components/WhatsAppChat";

export const metadata = {
  title: "Cevenpro | Propiedades e inversión en Panamá",
  description: "Venta, alquiler e inversión inmobiliaria en Panamá con asesoría comercial, financiera, legal y migratoria.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3020"),
  applicationName: "Cevenpro",
  appleWebApp: { capable: true, title: "Cevenpro" },
  icons: { icon: "/brand/cevenpro-app-icon.svg" }
};

export const viewport = { themeColor: "#0b1d33" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}<PwaRegistration /><WhatsAppChat /></body>
    </html>
  );
}
