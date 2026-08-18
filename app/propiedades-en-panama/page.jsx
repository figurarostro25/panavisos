import { LeadLandingPage } from "@/app/LeadLandingPage";
import { leadPages } from "@/lib/leadPages";

const page = leadPages["propiedades-en-panama"];

export const metadata = {
  title: page.metaTitle,
  description: page.description,
  alternates: { canonical: `/${page.slug}` }
};

export default function PanamaPropertiesPage() {
  return <LeadLandingPage page={page} />;
}
