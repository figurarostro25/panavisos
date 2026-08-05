export const metadata = {
  title: "Marketplace de Panama | Vehiculos, empleos y servicios | PanAvisos",
  description:
    "Compra, vende y encuentra vehiculos, empleos, servicios, productos y oportunidades locales en Panama.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Marketplace de Panama | PanAvisos",
    description: "Clasificados de vehiculos, empleos, servicios y productos en Panama.",
    type: "website"
  }
};

export default function MarketplaceLayout({ children }) {
  return children;
}
