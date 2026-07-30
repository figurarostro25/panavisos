import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [type, token] = header.split(" ");
  return type?.toLowerCase() === "bearer" ? token : "";
}

async function canUpload(request) {
  if (await requireAdmin()) return true;

  const token = getBearerToken(request);
  if (!token) return false;

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  return !error && Boolean(data?.user);
}

export async function POST(request) {
  if (!(await canUpload(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "panavisos/listings";

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no esta configurado." }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder
  });
}
