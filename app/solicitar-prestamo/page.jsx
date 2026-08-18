import { RequestFormPage } from "@/app/RequestFormPage";

export const metadata = {
  title: "Solicitud de préstamo o refinanciamiento | PanAvisos",
  description: "Solicita orientación privada sobre préstamos, refinanciamiento y consolidación en Panamá."
};

export default function SolicitarPrestamoPage() {
  return <RequestFormPage mode="loan" />;
}
