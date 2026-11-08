import { createHmac } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const MESSAGE_LIMIT = 15;
const MESSAGE_WINDOW_SECONDS = 10 * 60;

export async function checkMessageRateLimit(request) {
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const forwardedIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const clientIp = forwardedIp.split(",")[0].trim();
  const secret = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!clientIp) {
    throw new Error("Trusted client IP is unavailable.");
  }
  if (!secret) {
    throw new Error("Rate limit secret is unavailable.");
  }

  // Store only a keyed digest, never the visitor's raw IP address.
  const keyHash = createHmac("sha256", secret)
    .update(`panavisos:message-rate-limit:v1:${clientIp}`)
    .digest("hex");

  const { data, error } = await getSupabaseAdmin().rpc("consume_api_rate_limit", {
    p_key_hash: keyHash,
    p_max_requests: MESSAGE_LIMIT,
    p_window_seconds: MESSAGE_WINDOW_SECONDS
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const decision = Array.isArray(data) ? data[0] : data;
  if (typeof decision?.allowed !== "boolean") {
    throw new Error("Rate limit check returned an invalid response.");
  }

  return {
    allowed: decision.allowed,
    retryAfterSeconds: Math.max(0, Number(decision.retry_after_seconds) || 0)
  };
}
