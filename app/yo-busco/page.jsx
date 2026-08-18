import { RequestFormPage } from "@/app/RequestFormPage";

export const metadata = {
  title: "Yo busco | PanAvisos",
  description: "Cuéntanos qué propiedad, empleo, vehículo, producto o servicio necesitas encontrar en Panamá."
};

export default function YoBuscoPage() {
  return <RequestFormPage mode="search" />;
}
