import "./styles.css";

export const metadata = {
  title: "PanAvisos | Clasificados, empleos, vehiculos y propiedades en Panama",
  description: "Encuentra y publica propiedades, vehiculos, empleos, servicios y productos en Panama."
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
