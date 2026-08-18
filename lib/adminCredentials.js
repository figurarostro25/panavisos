import crypto from "node:crypto";

const HASH_PREFIX = "scrypt";

export function normalizeAdminEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function hashAdminPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyAdminPassword(password, storedHash) {
  const [prefix, salt, storedKey] = String(storedHash || "").split("$");
  if (prefix !== HASH_PREFIX || !salt || !storedKey) return false;

  const derivedKey = crypto.scryptSync(String(password), salt, 64);
  const expectedKey = Buffer.from(storedKey, "hex");
  return expectedKey.length === derivedKey.length && crypto.timingSafeEqual(derivedKey, expectedKey);
}

export function hashRecoveryToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function createRecoveryToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashRecoveryToken(token) };
}
