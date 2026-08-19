import "server-only";

import { getCurrentAccount, requireAccount } from "@/lib/accountAuth";

export async function getInternalRole() {
  const account = await getCurrentAccount();
  if (!account) return null;
  return account.role === "master" ? "owner" : "seller";
}

export async function requireInternalRole() {
  const account = await requireAccount();
  return account ? (account.role === "master" ? "owner" : "seller") : null;
}

export async function getInternalUser() {
  return getCurrentAccount();
}

export async function requireInternalUser(options) {
  return requireAccount(options);
}
