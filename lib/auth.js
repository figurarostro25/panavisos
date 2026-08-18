import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "panavisos_admin";
const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.PANAVISOS_SESSION_SECRET;
  if (!secret) throw new Error("Missing PANAVISOS_SESSION_SECRET.");
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionValue() {
  return createSessionValueForRole("owner");
}

export function createSessionValueForRole(role = "owner") {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const safeRole = role === "editor" ? "editor" : "owner";
  const payload = `${expiresAt}.${safeRole}`;
  return `${payload}.${sign(payload)}`;
}

export function getSessionRole(value) {
  if (!value || !value.includes(".")) return null;
  const parts = value.split(".");
  const legacySession = parts.length === 2;
  const payload = legacySession ? parts[0] : `${parts[0]}.${parts[1]}`;
  const signature = legacySession ? parts[1] : parts[2];
  const expected = sign(payload);
  const expiresAt = Number(parts[0]);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  if (!signature || signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return legacySession ? "owner" : parts[1] === "editor" ? "editor" : "owner";
}

export function isValidSession(value) {
  return Boolean(getSessionRole(value));
}

export async function getAdminRole() {
  const cookieStore = await cookies();
  return getSessionRole(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  return Boolean(await getAdminRole());
}

export async function requireOwner() {
  return (await getAdminRole()) === "owner";
}

export async function setAdminCookie(value) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
