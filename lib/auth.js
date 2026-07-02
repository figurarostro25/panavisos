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
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(value) {
  if (!value || !value.includes(".")) return false;
  const [payload, signature] = value.split(".");
  const expected = sign(payload);
  const expiresAt = Number(payload);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;

  if (!isValidSession(value)) {
    return false;
  }

  return true;
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
