import { AdvisorRegistrationForm } from "@/components/AdvisorRegistrationForm";

export const metadata = { title: "Trabaja con nosotros | Cevenpro", robots: { index: false, follow: false } };

export default function AdvisorRegistrationPage() {
  return <main className="internal-access-page"><AdvisorRegistrationForm /></main>;
}
