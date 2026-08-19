import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { INTERNAL_COOKIE, resolveInternalRole } from "@/lib/internalAccess";

export const ACCOUNT_COOKIE = "cevenpro_account_session";
const SESSION_HOURS = 24 * 14;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 180);
}

export function cleanAccountText(value, max = 180) {
  return String(value || "").trim().slice(0, max);
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, key) => error ? reject(error) : resolve(key));
  });
  return `${salt}:${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, encoded) {
  const [salt, expected] = String(encoded || "").split(":");
  if (!salt || !expected) return false;
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, key) => error ? reject(error) : resolve(key));
  });
  const candidate = Buffer.from(derived);
  const reference = Buffer.from(expected, "hex");
  return candidate.length === reference.length && crypto.timingSafeEqual(candidate, reference);
}

export function passwordIsValid(password) {
  return typeof password === "string" && password.length >= 10 && password.length <= 200;
}

function hashToken(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export async function createAccountSession(sql, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  await sql`
    insert into public.cevenpro_account_sessions (user_id, token_hash, expires_at)
    values (${userId}, ${hashToken(token)}, now() + interval '14 days')
  `;
  return token;
}

export function applyAccountSession(response, token) {
  response.cookies.set(ACCOUNT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60
  });
  return response;
}

export async function getCurrentAccount() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_COOKIE)?.value;
  const sql = getSql();
  if (token && sql) {
    try {
      const [user] = await sql`
        select u.id, u.name, u.email, u.phone, u.role, u.status, u.bio, u.website, u.whatsapp
        from public.cevenpro_account_sessions s
        join public.cevenpro_users u on u.id = s.user_id
        where s.token_hash = ${hashToken(token)}
          and s.expires_at > now()
          and u.status = 'active'
        limit 1
      `;
      if (user) return { ...user, legacy: false };
    } catch (error) {
      console.error("[Cevenpro] No se pudo validar la sesión de cuenta.", { message: error?.message });
    }
  }

  // Keeps the current master access working only until the first real master account is created.
  const legacyRole = resolveInternalRole(cookieStore.get(INTERNAL_COOKIE)?.value || "");
  if (legacyRole === "owner") return { id: null, name: "Administrador", role: "master", status: "active", legacy: true };
  if (legacyRole === "seller") return { id: null, name: "Colaborador", role: "advisor", status: "active", legacy: true };
  return null;
}

export async function requireAccount({ masterOnly = false } = {}) {
  const account = await getCurrentAccount();
  if (!account || (masterOnly && account.role !== "master")) return null;
  return account;
}

export async function hasRealMasterAccount() {
  const sql = getSql();
  if (!sql) return false;
  try {
    const [row] = await sql`select 1 from public.cevenpro_users where role = 'master' limit 1`;
    return Boolean(row);
  } catch {
    return false;
  }
}

export function clearAccountSession(response) {
  response.cookies.delete(ACCOUNT_COOKIE);
  return response;
}
