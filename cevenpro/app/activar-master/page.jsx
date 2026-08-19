import { redirect } from "next/navigation";
import { MasterAccountSetup } from "@/components/MasterAccountSetup";
import { getCurrentAccount, hasRealMasterAccount } from "@/lib/accountAuth";

export const metadata = { title: "Activar cuenta master | Cevenpro", robots: { index: false, follow: false } };

export default async function ActivateMasterPage() {
  const [account, hasMaster] = await Promise.all([getCurrentAccount(), hasRealMasterAccount()]);
  if (!account?.legacy || account.role !== "master" || hasMaster) redirect("/admin");
  return <MasterAccountSetup />;
}
