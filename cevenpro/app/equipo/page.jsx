import { AdminDashboard } from "@/components/AdminDashboard";
import { InternalAccessGate } from "@/components/InternalAccessGate";
import { getCurrentAccount } from "@/lib/accountAuth";

export const metadata = { title: "Panel de colaborador | Cevenpro" };

export default async function TeamPage() {
  const account = await getCurrentAccount();
  if (account?.role !== "advisor") {
    return <InternalAccessGate role="seller" title="Acceso de asesor" />;
  }
  return <AdminDashboard initialUser={account} />;
}
