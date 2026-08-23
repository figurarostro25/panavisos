import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAuthenticatedViewer(request) {
  const header = String(request.headers.get("authorization") || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return null;

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  return error ? null : data?.user || null;
}
