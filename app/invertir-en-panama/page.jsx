import { LeadLandingPage } from "@/app/LeadLandingPage";
import { leadPages } from "@/lib/leadPages";

const page = leadPages["invertir-en-panama"];

export const metadata = {
  title: page.metaTitle,
  description: page.description,
  alternates: { canonical: `/${page.slug}` }
};

export default function InvestInPanamaPage() {
  return <LeadLandingPage page={page} />;
}
