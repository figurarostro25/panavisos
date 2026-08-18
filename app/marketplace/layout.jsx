export const metadata = {
  title: "Marketplace de Panamá | Vehiculos, empleos y servicios | PanAvisos",
  description:
    "Compra, vende y encuentra vehículos, empleos, servicios, productos y oportunidades locales en Panamá.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Marketplace de Panamá | PanAvisos",
    description: "Clasificados de vehículos, empleos, servicios y productos en Panamá.",
    type: "website"
  }
};

export default function MarketplaceLayout({ children }) {
  return children;
}
