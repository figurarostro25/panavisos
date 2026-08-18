import { LeadLandingPage } from "@/app/LeadLandingPage";
import { leadPages } from "@/lib/leadPages";

const page = leadPages["asesoria-migratoria-legal"];

export const metadata = {
  title: page.metaTitle,
  description: page.description,
  alternates: { canonical: `/${page.slug}` }
};

export default function LegalMigrationPage() {
  return <LeadLandingPage page={page} />;
}
