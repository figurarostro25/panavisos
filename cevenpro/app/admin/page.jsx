import { AdminDashboard } from "@/components/AdminDashboard";
import { InternalAccessGate } from "@/components/InternalAccessGate";
import { getCurrentAccount } from "@/lib/accountAuth";

export const metadata = { title: "Panel de control | Cevenpro" };

export default async function AdminPage() {
  const account = await getCurrentAccount();
  if (account?.role !== "master") {
    return <InternalAccessGate role="owner" title="Administración" />;
  }
  return <AdminDashboard initialUser={account} />;
}
