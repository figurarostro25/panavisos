const buckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 6;

function requestKey(request, suffix = "anonymous") {
  const forwarded =
    request.headers.get("x-forwarded-for") || request.headers.get("x-vercel-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${suffix}`;
}

export function rateLimit(request, suffix = "anonymous", limit = MAX_REQUESTS) {
  const now = Date.now();
  const key = requestKey(request, suffix);
  const current = (buckets.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (current.length >= limit) {
    buckets.set(key, current);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - current[0])) / 1000))
    };
  }

  current.push(now);
  buckets.set(key, current);
  return { allowed: true, retryAfter: 0 };
}

export function rateLimitResponse(retryAfter) {
  return {
    error: "Has enviado demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.",
    retryAfter
  };
}

export function isHoneypotTriggered(value) {
  return Boolean(String(value || "").trim());
}
