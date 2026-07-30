import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [type, token] = header.split(" ");
  return type?.toLowerCase() === "bearer" ? token : "";
}

export async function getRequestUser(request) {
  const token = getBearerToken(request);
  if (!token) return { user: null, error: "No autorizado." };

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data?.user) return { user: null, error: "No autorizado." };

  return { user: data.user, error: null };
}
