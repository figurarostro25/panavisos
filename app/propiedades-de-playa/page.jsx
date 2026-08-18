import { LeadLandingPage } from "@/app/LeadLandingPage";
import { leadPages } from "@/lib/leadPages";

const page = leadPages["propiedades-de-playa"];

export const metadata = {
  title: page.metaTitle,
  description: page.description,
  alternates: { canonical: `/${page.slug}` }
};

export default function BeachPropertiesPage() {
  return <LeadLandingPage page={page} />;
}
