import "server-only";

import crypto from "node:crypto";

// Version the cookie when access rules change so old sessions stop working.
export const INTERNAL_COOKIE = "cevenpro_internal_access_v2";

function secretFor(role) {
  if (role === "owner") return process.env.CEVENPRO_ADMIN_PASSWORD || "";
  return process.env.CEVENPRO_TEAM_PASSWORD || "";
}

export function userFor(role) {
  if (role === "owner") return process.env.CEVENPRO_ADMIN_USER || "administrador";
  return process.env.CEVENPRO_TEAM_USER || "equipo";
}

export function accessToken(role) {
  const secret = secretFor(role);
  if (!secret) return "";
  return crypto.createHash("sha256").update(`cevenpro:${role}:${secret}`).digest("hex");
}

export function hasInternalAccess(cookieValue, role) {
  const expected = accessToken(role);
  if (!expected || !cookieValue) return false;
  const candidate = Buffer.from(String(cookieValue));
  const reference = Buffer.from(expected);
  return candidate.length === reference.length && crypto.timingSafeEqual(candidate, reference);
}

export function validInternalPassword(password, role) {
  const expected = secretFor(role);
  if (!expected || !password) return false;
  const candidate = Buffer.from(String(password));
  const reference = Buffer.from(expected);
  return candidate.length === reference.length && crypto.timingSafeEqual(candidate, reference);
}

export function validInternalCredentials(username, password, role) {
  const expectedUser = userFor(role).trim().toLowerCase();
  const receivedUser = String(username || "").trim().toLowerCase();
  return receivedUser === expectedUser && validInternalPassword(password, role);
}

export function resolveInternalRole(cookieValue) {
  const [role = "", token = ""] = String(cookieValue || "").split(":");
  if (role === "owner" && hasInternalAccess(token, "owner")) return "owner";
  if (role === "seller" && hasInternalAccess(token, "seller")) return "seller";
  return null;
}
