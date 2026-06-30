import "./styles.css";

export const metadata = {
  title: "PanAvisos",
  description: "Marketplace de anuncios en Panama"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
