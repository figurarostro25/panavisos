import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogClient } from "@/components/CatalogClient";
import { getPublicProperties } from "@/lib/properties";

export const metadata = {
  title: "Clasificados inmobiliarios en Panamá | Cevenpro",
  description: "Propiedades en venta y alquiler en Panamá. Filtra por provincia, sector, tipo y presupuesto."
};

export default async function PropertiesPage({ searchParams }) {
  const properties = await getPublicProperties();
  const params = await searchParams;
  const requestedOperation = String(params?.operacion || "").trim();
  const operationAliases = { Comprar: "Venta", Alquilar: "Alquiler" };
  const initialFilters = {
    operation: operationAliases[requestedOperation] || requestedOperation,
    type: String(params?.tipo || "").trim(),
    province: String(params?.provincia || "").trim(),
    zone: String(params?.zona || "").trim(),
    maxPrice: String(params?.precio || "").trim(),
    query: String(params?.ubicacion || params?.q || "").trim()
  };

  return (
    <>
      <Header compact />
      <main className="content-section wash catalog-section">
        <div className="shell"><CatalogClient properties={properties} initialFilters={initialFilters} /></div>
      </main>
      <Footer />
    </>
  );
}
