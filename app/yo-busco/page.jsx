import { RequestFormPage } from "@/app/RequestFormPage";

export const metadata = {
  title: "Publica lo que buscas en Panamá | Yo busco | PanAvisos",
  description: "Publica gratis lo que buscas en Panamá: apartamento, empleo, auto, producto o servicio. Indica presupuesto y zona para que te contacten."
};

export default function YoBuscoPage() {
  return <RequestFormPage mode="search" />;
}
